# Mathitude Quest — Middle School Math: Fixes Document

**Source file:** `QMS_BOOK.AMAZON.20220525.pdf`
**Review date:** 2026-04-10
**Total pages reviewed:** 113

This document lists every error found during a page-by-page review, with the recommended fix for each. Errors are grouped by severity.

---

## CRITICAL — Math / Logic Errors (must fix; affect student learning)

### Page 78 — Mean calculation divisor wrong
**Section:** Super Stats → Mean, Median and Mode Summary

**Current text:**
> Add 6 + 5 + 3 + 7 + 4 + 1 + 2 + 8 + 11 + 9 + 10 + 6 + 12.
> These observations sum to 84.
> We divide this total by the number of observations: (84 ÷ **12** = 7).
> The mean, or average, is **7** for this dataset.

**Problem:** The dataset contains **13** numbers, not 12. The sorted list shown directly below ("1, 2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11, 12") confirms 13 observations.

**Fix — Option A (preferred, keeps the clean integer answer):** Drop one observation so the dataset has 12 numbers and the mean is genuinely 7. Suggested rewrite:
> Example Dataset: **6, 5, 3, 7, 4, 1, 2, 8, 9, 10, 6, 12** (remove the 11)
> Add 6 + 5 + 3 + 7 + 4 + 1 + 2 + 8 + 9 + 10 + 6 + 12 = **73**
>
> Wait — that doesn't sum to 84 either. Better: **change the dataset to one that genuinely sums to 84 over 12 numbers**, e.g.:
> `6, 5, 3, 7, 4, 1, 2, 8, 11, 10, 15, 12` → sum = 84, n = 12, mean = 7
> Then update the sorted list and median accordingly (median becomes the average of the 6th and 7th values).

**Fix — Option B (keeps the dataset, fixes the math):** Leave the 13-number dataset and correct the calculation:
> These observations sum to 84.
> We divide this total by the number of observations: (84 ÷ **13** ≈ 6.46).
> The mean, or average, is approximately **6.46** for this dataset.
>
> (Note: this loses the clean integer answer, which is pedagogically less ideal.)

**Recommendation:** Use Option A — pick a 12-number dataset that sums to 84.

---

### Page 101 — Divisibility answer key error for 2,793
**Section:** Answer Key → Divisibility Rules

**Current answer row for 2,793:** `N Y N N **Y** N N N`
(columns: 2, 3, 4, 6, 9, 15, 18, 24)

**Problem:** 2 + 7 + 9 + 3 = 21. 21 is divisible by 3 but **not** by 9 (21 ÷ 9 = 2.33). The "9" column should be N, not Y.

**Fix:** Change row for 2,793 to: `N Y N N **N** N N N`

---

### Page 107 — Positively Negativity Q4 answer wrong
**Section:** Answer Key → Positively Negativity

**Problem statement (page 77):** `−3² − (−3)³ − (−4 − 7)²`

**Current answer:** `4. −10`

**Correct calculation:**
- −3² = −(3²) = −9
- (−3)³ = −27, so −(−3)³ = +27
- (−4 − 7)² = (−11)² = 121, so −(−4−7)² = −121
- Total: −9 + 27 − 121 = **−103**

**Fix — Option A:** Change answer to `4. −103`.

**Fix — Option B (if you want to keep "−10" as the answer):** Modify the problem so −10 is correct. For example:
- `−3² − (−3) − (−4 − 7) × 1` doesn't work either.
- It's easiest to just correct the answer to **−103**.

**Recommendation:** Update the answer key to **−103**.

---

### Page 46 — Q14 and Q15 share identical numbers (copy/paste error)
**Section:** Radical Ratios → Rates challenge problems

**Current state:**
- Q14: "Which car gets better gas mileage?" Car A: 675 miles / 27 gallons; Car B: 784 miles / 28 gallons. ✅ Reasonable.
- Q15: "Which is the better buy, Box A or B?" Box A: cost $675 / 27 cupcakes; Box B: cost $784 / 28 cupcakes. ❌ That's $25–$28 *per cupcake*. Q15's data was never updated from Q14.

**Fix:** Replace Q15's table with realistic cupcake numbers, e.g.:
| Cupcakes | Box A | Box B |
|---|---|---|
| Cost (dollars) | 12 | 18 |
| Number of Cupcakes | 8 | 15 |

(Box A: $1.50/cupcake; Box B: $1.20/cupcake → Box B is the better buy. Update the answer key entry on page 99 if needed — currently it just says "Box A".)

---

## HIGH — Visual / Diagram Errors (your "diagrams not the same color" example)

### Pages 52–54 — Yellow/Purple color mismatch (Domino Ratios)
**Section:** Domino Ratios

**Problem:** Problems 1, 2, and 3 reference ratios with **yellow** tiles:
- Problem 1: "make a 2:5:7 blue:**yellow**:red ratio"
- Problem 2: "1:2:3 ratio of red, **yellow**, and blue" / "3:2:1 ratio of red, **yellow**, and blue"
- Problem 3: "Make a 1:2:6 ratio of blue, **yellow**, and red"

But the tile diagrams provided show **PURPLE**, red, and blue squares — there is **no yellow tile anywhere** on these pages. The answer key on page 100 also uses "yellow" in the descriptions while the solution images clearly show purple tiles.

**Fix — Option A (preferred):** Recolor every "purple" tile in pages 52–54 (and the answer images on page 100) to **yellow**. This is consistent with the example on page 52 which uses purple/red/blue (and the example doesn't mention "yellow"), but problems 1–4 introduce "yellow" so the artwork needs to match.

**Fix — Option B:** Change every instance of "yellow" in the problem and answer text on pages 52–54 and page 100 to "**purple**". This is the smaller textual fix but the example on page 52 already establishes purple, red, blue as the palette, so this works.

**Recommendation:** Option B (text-only edit) is the easier fix. Specifically:
- p52, problem 1: "2:5:7 blue:**purple**:red ratio"
- p53, problem 2: "1:2:3 ratio of red, **purple**, and blue" / "3:2:1 ratio of red, **purple**, and blue"
- p53, problem 3: "1:2:6 ratio of blue, **purple**, and red"
- p100 answer 1: "4 blue, 10 **purple**, and 14 red squares"
- p100 answer 2: "4 red, 8 **purple**, and 12 blue" / "12 red, 8 **purple**, and 4 blue"
- p100 answer 3: "5 blue, 10 **purple**, and 30 red squares"

---

### Page 40 — Triangle reference card geometry inconsistency
**Section:** Geometry Concepts → Area of a Triangle example

**Problem:** Diagram shows a triangle with sides labeled 5, 7, and base 9, with perpendicular height = 4, giving Area = 9 × 4 / 2 = 18.

A 5–7–9 triangle is geometrically valid (passes triangle inequality), but its actual perpendicular height from the base of 9 is ≈3.87, not 4 (Heron's formula gives area ≈17.41, not 18).

**Fix:** Either:
- (A) Change the side labels so the triangle's actual height is exactly 4. With base = 9 and height = 4, the foot of the altitude divides 9 into two segments. Pick foot at, say, 3 from one end → side₁ = √(3² + 4²) = 5 ✓ and side₂ = √(6² + 4²) = √52 ≈ 7.21. Close but not 7. Try foot at 2.25: side₁ = √(2.25² + 4²) = √(5.0625 + 16) = √21.0625 ≈ 4.59. Not clean. **Easiest clean fix:** use a 3-4-5 right triangle as the example (base = 3, height = 4, area = 6) or a triangle with sides 5, 5, 6 (height = 4 from base 6, area = 12) — both have integer sides AND integer height.
- (B) Just remove the 5 and 7 side labels entirely (keep only base = 9 and height = 4). The pedagogical point ("use the right-angle height, not slant height") still works without specifying the slant heights.

**Recommendation:** Option B — remove the 5 and 7 labels (or replace with generic labels), since the slant heights aren't needed for the area calculation anyway.

---

## MEDIUM — Typos / Wording

### Page 22 — Customer 1 worked example shows wrong fraction
**Section:** Decimals, Money Mania

**Current:** Customer 1 problem says "2/5 lb Choc Bombs" but the worked example reads `7/5 × .50 = .4 × .5 = $.20`.

**Problem:** 7/5 ≠ 0.4. The numerator should be 2 (since 2/5 = 0.4, and the final result $0.20 is consistent with 2/5).

**Fix:** Change `7/5 × .50` to `2/5 × .50`.

---

### Page 51 — Missing word in Q13
**Section:** Percents Plus exercises

**Current:** "...how many students like baseball if there 20 boys and 30 girls in the class?"

**Fix:** "...how many students like baseball if there **are** 20 boys and 30 girls in the class?"

---

### Page 99 — Answer key Q9 units error
**Section:** Answer Key → Geometry Concepts (pp. 41–43)

**Current:** "9. A = 8 × 6 = 48 cm"

**Fix:** "9. A = 8 × 6 = 48 cm**²**"
(Area must be in square units.)

---

### Page 100 — Answer key punctuation in Domino Ratios Q2
**Section:** Answer Key → Domino Ratios

**Current:** "Make sure your top half has 4 red, 8, yellow, and 12 blue squares while your bottom half should have 12, red, 8 yellow, and 4 blue tiles."

**Problem:** Stray commas after "8" and "12".

**Fix:** "Make sure your top half has **4 red, 8 yellow, and 12 blue** squares while your bottom half should have **12 red, 8 yellow, and 4 blue** tiles."

(Combine with the yellow→purple fix from pages 52–54 if you go that route.)

---

## LOW — Cosmetic / Layout

### Page 4 — Nearly blank page
**Current:** Page 4 contains only the page header, footer, and page number. No content body.

**Fix:** Either delete the page entirely (and re-paginate everything after), or add a section divider / illustration / "Welcome" graphic. If it's an intentional facing-page spacer for print layout, leave it but note it explicitly.

**Recommendation:** Verify whether this is intentional (printer's spread requirement). If not, delete it.

---

### "QUIZZLES" / "QUIZZLE" terminology — NOT an error
**Pages:** 6, 89, 90

This is intentional wordplay (quiz + puzzle) introduced on page 89 ("Power Panel: Solving Quizzles"). **No fix needed.** Mentioned here only so reviewers don't flag it.

---

## Summary Table

| Severity | Page | Issue | Fix Type |
|---|---|---|---|
| CRITICAL | 78 | Mean divisor 12 should be 13 (or change dataset) | Math |
| CRITICAL | 101 | 2,793 marked divisible by 9 (it isn't) | Answer key |
| CRITICAL | 107 | Q4 answer −10 should be −103 | Answer key |
| CRITICAL | 46 | Q15 has Q14's data (cupcakes at $25 each) | Copy/paste |
| HIGH | 52–54, 100 | "Yellow" tiles drawn as purple | Color/text |
| HIGH | 40 | Triangle 5-7-9 with height 4 is impossible | Diagram |
| MEDIUM | 22 | Customer 1 shows 7/5 instead of 2/5 | Typo |
| MEDIUM | 51 | Q13 missing "are" | Typo |
| MEDIUM | 99 | "48 cm" should be "48 cm²" | Units |
| MEDIUM | 100 | Stray commas in answer 2 | Punctuation |
| LOW | 4 | Nearly blank page | Layout |

**Total errors flagged: 11**
- Critical: 4
- High: 2
- Medium: 4
- Low: 1

---

## Recommended fix order

1. **First pass — Critical math (1 hour):** Fix pages 46, 78, 101, 107. These are answer key / arithmetic errors that directly mislead students.
2. **Second pass — Visual fixes (1–2 hours):** Pages 52–54 + 100 (yellow/purple) and page 40 (triangle). Easiest version of each = text-only edit.
3. **Third pass — Typos (15 min):** Pages 22, 51, 99, 100.
4. **Final pass — Layout (5 min):** Decide on page 4.

After fixes, do one more end-to-end read-through of just the answer key (pages 91–112) since that's where the highest concentration of high-severity errors landed.
