// buildQuery.js

/**
 * buildESQueryFromFilters(filters):
 *   Given an array of filters, each filter shaped like:
 *   {
 *     column: string,
 *     condition: "contains" | "equals" | "is empty" | "is not empty",
 *     tokens: string[],
 *     subop: "AND" | "OR"
 *   }
 *
 *   1) We generate a sub-query for each filter line via buildSingleFilter().
 *   2) By default, lines are combined with "AND" logic (i.e. "must").
 *      If you want to support "OR" logic among lines, see the subop block.
 *   3) Returns a top-level Elasticsearch bool query.
 */

export function buildESQueryFromFilters(filters = []) {
  // If no filters, just match all docs
  if (!filters.length) {
    return { match_all: {} };
  }

  const mustClauses = [];
  const shouldClauses = [];
  let currentShouldGroup = []; // Collects sequences of OR filters

  filters.forEach((f, index) => {
    const isFirst = index === 0;
    // subop can be "AND" or "OR" to combine this filter with the previous one
    const subop = f.subop || (isFirst ? "AND" : "AND");

    // 1) Build subquery for this line
    const subQuery = buildSingleFilter(f);

    // 2) Combine subQuery in the final bool
    if (isFirst || subop === "AND") {
      // If we have a pending OR group, resolve it first
      if (currentShouldGroup.length > 0) {
        if (currentShouldGroup.length === 1) {
          // Just one item in the OR group, add it directly
          shouldClauses.push(currentShouldGroup[0]);
        } else {
          // Multiple items in OR group, wrap in a bool should
          shouldClauses.push({
            bool: {
              should: currentShouldGroup,
              minimum_should_match: 1
            }
          });
        }
        // Reset the OR group
        currentShouldGroup = [];
      }
      
      // Add the current filter to the must clauses
      mustClauses.push(subQuery);
    } else if (subop === "OR") {
      // This is part of an OR group with the previous filter
      
      // If this is the first OR after a sequence of ANDs
      if (currentShouldGroup.length === 0 && mustClauses.length > 0) {
        // Move the last must clause to the should group
        currentShouldGroup.push(mustClauses.pop());
      }
      
      // Add this filter to the OR group
      currentShouldGroup.push(subQuery);
      
      // If this is the last filter, flush the OR group
      if (index === filters.length - 1) {
        if (currentShouldGroup.length === 1) {
          // Just one item, add directly to should
          shouldClauses.push(currentShouldGroup[0]);
        } else {
          // Multiple items, wrap in a bool should
          shouldClauses.push({
            bool: {
              should: currentShouldGroup,
              minimum_should_match: 1
            }
          });
        }
      }
    }
  });

  // Final top-level bool
  const boolQuery = {
    bool: {}
  };
  
  // Add must clauses if they exist
  if (mustClauses.length > 0) {
    boolQuery.bool.must = mustClauses;
  }
  
  // Add should clauses if they exist
  if (shouldClauses.length > 0) {
    boolQuery.bool.should = shouldClauses;
    boolQuery.bool.minimum_should_match = 1;
  }
  
  return boolQuery;
}

/**
 * buildSingleFilter(f):
 *   Generates a sub-query for a single filter object.
 *   The important part:
 *     - "contains": we split multi-word tokens on whitespace, so
 *       "Car Wash" => must have "*Car*" AND "*Wash*" ignoring case.
 */
function buildSingleFilter(f) {
  const col = f.column;
  const cond = f.condition;
  const tokens = Array.isArray(f.tokens) ? f.tokens : [];

  switch (cond) {
    case "is empty":
      // "Field does not exist OR it's empty string"
      return {
        bool: {
          should: [
            { bool: { must_not: { exists: { field: col } } } },
            { term: { [`${col}.keyword`]: "" } },
          ],
          minimum_should_match: 1,
        },
      };

    case "is not empty":
      // "Field exists AND is not the empty string"
      return {
        bool: {
          must: [
            { exists: { field: col } },
            {
              bool: {
                must_not: { term: { [`${col}.keyword`]: "" } },
              },
            },
          ],
        },
      };

    case "contains": {
      /**
       * We'll split each token on whitespace.
       * E.g. tokens = ["Car Wash"]
       * => "Car Wash" -> split => ["Car", "Wash"]
       * => a "must" array: [ wildcard:*Car*, wildcard:*Wash* ]
       * Then across multiple tokens, we OR them.
       */
      const shouldArr = tokens.map((rawToken) => {
        const trimmed = rawToken.trim();
        if (!trimmed) {
          // If empty token, fallback or skip
          return { match_all: {} };
        }

        // Split "Car Wash" => ["Car", "Wash"]
        const subWords = trimmed.split(/\s+/);

        // Build a must array for each sub-word: must contain "*Car*" AND "*Wash*"
        const mustClauses = subWords.map((w) => ({
          wildcard: {
            [col]: {
              value: `*${w}*`,
              case_insensitive: true,
            },
          },
        }));

        // Return a bool must for these sub-words
        return {
          bool: {
            must: mustClauses,
          },
        };
      });

      // If multiple tokens in f.tokens, we OR them
      return {
        bool: {
          should: shouldArr,
          minimum_should_match: 1,
        },
      };
    }

    case "equals":
      // If multiple tokens, we OR them
      // For exact match ignoring case, you'd do wildcard with no "*" but case_insensitive: true
      // Or store a `.keyword_lower` to do a direct term match. For now, let's keep it as .keyword
      const eqArr = tokens.map((t) => ({
        term: { [`${col}.keyword`]: t },
      }));
      return {
        bool: {
          should: eqArr,
          minimum_should_match: 1,
        },
      };

    default:
      // Fallback for unknown conditions => match_all
      return { match_all: {} };
  }
}
