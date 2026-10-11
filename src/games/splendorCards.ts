/**
 * Canonical base-game development card costs, bonuses, and points transcribed from:
 * hexanome-04/splendor/server/src/main/resources/cards.csv at commit
 * d1797acf5d43c6bc512b57ef3c1d990006a49a5c.
 * Upstream LICENSE: https://github.com/hexanome-04/splendor/blob/d1797acf5d43c6bc512b57ef3c1d990006a49a5c/LICENSE
 * Copyright (c) 2023 Alex, Alexa, Chen, Jia, Richard, Sarah. Licensed under the MIT License.
 *
 * MIT License
 *
 * Copyright (c) 2023 Alex, Alexa, Chen, Jia, Richard, Sarah
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import type { Gem } from './splendor';
export interface SplendorCardData { tier: 1 | 2 | 3; bonus: Gem; points: number; cost: Partial<Record<Gem, number>> }
export const canonicalCards: SplendorCardData[] = [
  {
    "tier": 1,
    "bonus": "white",
    "points": 1,
    "cost": {
      "green": 4
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 1,
    "cost": {
      "red": 4
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 1,
    "cost": {
      "black": 4
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 1,
    "cost": {
      "white": 4
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 1,
    "cost": {
      "blue": 4
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "white": 3,
      "blue": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "blue": 1,
      "green": 3,
      "red": 1
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 3,
      "green": 1
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 1,
      "red": 1,
      "black": 3
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "green": 1,
      "red": 3,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 3
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "black": 3
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "red": 3
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 3
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "green": 3
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 2,
      "green": 2,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "white": 1,
      "green": 2,
      "red": 2
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "blue": 1,
      "red": 2,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 2,
      "green": 1,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "white": 2,
      "blue": 2,
      "red": 1
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 2,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "green": 2,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "blue": 2,
      "red": 2
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 2,
      "red": 2
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "white": 2,
      "green": 2
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 1,
      "green": 2,
      "red": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "white": 1,
      "green": 1,
      "red": 2,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 1,
      "red": 1,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 2,
      "blue": 1,
      "green": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 2,
      "green": 1,
      "red": 1
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "red": 2,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "white": 1,
      "black": 2
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "white": 2,
      "blue": 1
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "blue": 2,
      "green": 1
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "green": 2,
      "red": 1
    }
  },
  {
    "tier": 1,
    "bonus": "white",
    "points": 0,
    "cost": {
      "blue": 1,
      "green": 1,
      "red": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "blue",
    "points": 0,
    "cost": {
      "white": 1,
      "green": 1,
      "red": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "green",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 1,
      "red": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "red",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 1,
      "green": 1,
      "black": 1
    }
  },
  {
    "tier": 1,
    "bonus": "black",
    "points": 0,
    "cost": {
      "white": 1,
      "blue": 1,
      "green": 1,
      "red": 1
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 1,
    "cost": {
      "green": 3,
      "red": 2,
      "black": 2
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 1,
    "cost": {
      "blue": 2,
      "green": 2,
      "red": 3
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 1,
    "cost": {
      "white": 2,
      "blue": 3,
      "black": 2
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 1,
    "cost": {
      "white": 2,
      "red": 2,
      "black": 3
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 1,
    "cost": {
      "white": 3,
      "blue": 2,
      "green": 2
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 1,
    "cost": {
      "white": 2,
      "blue": 3,
      "red": 3
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 1,
    "cost": {
      "blue": 2,
      "green": 3,
      "black": 3
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 1,
    "cost": {
      "white": 3,
      "green": 2,
      "red": 3
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 1,
    "cost": {
      "blue": 3,
      "red": 2,
      "black": 3
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 1,
    "cost": {
      "white": 3,
      "green": 3,
      "black": 2
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 3,
    "cost": {
      "white": 6
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 3,
    "cost": {
      "blue": 6
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 3,
    "cost": {
      "green": 6
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 3,
    "cost": {
      "red": 6
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 3,
    "cost": {
      "black": 6
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 2,
    "cost": {
      "green": 1,
      "red": 4,
      "black": 2
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 2,
    "cost": {
      "white": 2,
      "red": 1,
      "black": 4
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 2,
    "cost": {
      "white": 4,
      "blue": 2,
      "black": 1
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 2,
    "cost": {
      "white": 1,
      "blue": 4,
      "green": 2
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 2,
    "cost": {
      "blue": 1,
      "green": 4,
      "red": 2
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 2,
    "cost": {
      "red": 5
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 2,
    "cost": {
      "blue": 5
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 2,
    "cost": {
      "green": 5
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 2,
    "cost": {
      "black": 5
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 2,
    "cost": {
      "white": 5
    }
  },
  {
    "tier": 2,
    "bonus": "white",
    "points": 2,
    "cost": {
      "red": 5,
      "black": 3
    }
  },
  {
    "tier": 2,
    "bonus": "blue",
    "points": 2,
    "cost": {
      "white": 5,
      "blue": 3
    }
  },
  {
    "tier": 2,
    "bonus": "green",
    "points": 2,
    "cost": {
      "blue": 5,
      "green": 3
    }
  },
  {
    "tier": 2,
    "bonus": "red",
    "points": 2,
    "cost": {
      "white": 3,
      "black": 5
    }
  },
  {
    "tier": 2,
    "bonus": "black",
    "points": 2,
    "cost": {
      "green": 5,
      "red": 3
    }
  },
  {
    "tier": 3,
    "bonus": "white",
    "points": 3,
    "cost": {
      "blue": 3,
      "green": 3,
      "red": 5,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "blue",
    "points": 3,
    "cost": {
      "white": 3,
      "green": 3,
      "red": 3,
      "black": 5
    }
  },
  {
    "tier": 3,
    "bonus": "green",
    "points": 3,
    "cost": {
      "white": 5,
      "blue": 3,
      "red": 3,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "red",
    "points": 3,
    "cost": {
      "white": 3,
      "blue": 5,
      "green": 3,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "black",
    "points": 3,
    "cost": {
      "white": 3,
      "blue": 3,
      "green": 5,
      "red": 3
    }
  },
  {
    "tier": 3,
    "bonus": "white",
    "points": 4,
    "cost": {
      "black": 7
    }
  },
  {
    "tier": 3,
    "bonus": "blue",
    "points": 4,
    "cost": {
      "white": 7
    }
  },
  {
    "tier": 3,
    "bonus": "green",
    "points": 4,
    "cost": {
      "blue": 7
    }
  },
  {
    "tier": 3,
    "bonus": "red",
    "points": 4,
    "cost": {
      "green": 7
    }
  },
  {
    "tier": 3,
    "bonus": "black",
    "points": 4,
    "cost": {
      "red": 7
    }
  },
  {
    "tier": 3,
    "bonus": "white",
    "points": 4,
    "cost": {
      "white": 3,
      "red": 3,
      "black": 6
    }
  },
  {
    "tier": 3,
    "bonus": "blue",
    "points": 4,
    "cost": {
      "white": 6,
      "blue": 3,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "green",
    "points": 4,
    "cost": {
      "white": 3,
      "blue": 6,
      "green": 3
    }
  },
  {
    "tier": 3,
    "bonus": "red",
    "points": 4,
    "cost": {
      "blue": 3,
      "green": 6,
      "red": 3
    }
  },
  {
    "tier": 3,
    "bonus": "black",
    "points": 4,
    "cost": {
      "green": 3,
      "red": 6,
      "black": 3
    }
  },
  {
    "tier": 3,
    "bonus": "white",
    "points": 5,
    "cost": {
      "white": 3,
      "black": 7
    }
  },
  {
    "tier": 3,
    "bonus": "blue",
    "points": 5,
    "cost": {
      "white": 7,
      "blue": 3
    }
  },
  {
    "tier": 3,
    "bonus": "green",
    "points": 5,
    "cost": {
      "blue": 7,
      "green": 3
    }
  },
  {
    "tier": 3,
    "bonus": "red",
    "points": 5,
    "cost": {
      "green": 7,
      "red": 3
    }
  },
  {
    "tier": 3,
    "bonus": "black",
    "points": 5,
    "cost": {
      "red": 7,
      "black": 3
    }
  }
];
