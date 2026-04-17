"""Build FIXES.pdf and FIXES_APPLIED.pdf for Mathitude Quest Middle School Math review."""

from fpdf import FPDF

PURPLE = (102, 45, 145)
RED = (200, 0, 0)
GREEN = (0, 130, 0)
BLUE = (0, 70, 180)
GREY = (110, 110, 110)
BLACK = (0, 0, 0)


def _ascii(text):
    """Replace common Unicode characters with ASCII equivalents (fpdf core fonts are latin-1)."""
    if not isinstance(text, str):
        return text
    replacements = {
        "\u2014": "-",   # em dash
        "\u2013": "-",   # en dash
        "\u2018": "'",   # left single quote
        "\u2019": "'",   # right single quote
        "\u201c": '"',   # left double quote
        "\u201d": '"',   # right double quote
        "\u2026": "...", # ellipsis
        "\u00a9": "(c)", # copyright
        "\u00b2": "^2",  # superscript 2
        "\u00b3": "^3",  # superscript 3
        "\u00b0": " deg",
        "\u00f7": "/",   # division sign
        "\u00d7": "x",   # multiplication sign
        "\u2192": "->",  # right arrow
        "\u2248": "~",   # almost equal
        "\u2264": "<=",
        "\u2265": ">=",
        "\u2260": "!=",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode("latin-1", errors="replace").decode("latin-1")


# ---------------------------------------------------------------------------
# Shared "book-style" PDF base — mimics the Mathitude Quest layout
# ---------------------------------------------------------------------------
class BookStylePDF(FPDF):
    def __init__(self, header_text="Middle School Math Quest", footer_label="Copyright (c) 2022 by Mathitude.com"):
        super().__init__()
        self.header_text = _ascii(header_text)
        self.footer_label = _ascii(footer_label)
        self.set_auto_page_break(auto=True, margin=20)

    def cell(self, *args, **kwargs):
        if len(args) >= 3 and isinstance(args[2], str):
            args = list(args)
            args[2] = _ascii(args[2])
        if "text" in kwargs:
            kwargs["text"] = _ascii(kwargs["text"])
        if "txt" in kwargs:
            kwargs["txt"] = _ascii(kwargs["txt"])
        return super().cell(*args, **kwargs)

    def multi_cell(self, *args, **kwargs):
        if len(args) >= 3 and isinstance(args[2], str):
            args = list(args)
            args[2] = _ascii(args[2])
        if "text" in kwargs:
            kwargs["text"] = _ascii(kwargs["text"])
        if "txt" in kwargs:
            kwargs["txt"] = _ascii(kwargs["txt"])
        return super().multi_cell(*args, **kwargs)

    def header(self):
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(*PURPLE)
        self.cell(0, 12, self.header_text, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*PURPLE)
        self.set_line_width(0.4)
        self.line(15, self.get_y() + 1, 195, self.get_y() + 1)
        self.ln(6)
        self.set_text_color(*BLACK)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(*PURPLE)
        self.cell(60, 8, self.footer_label, align="L")
        self.cell(70, 8, str(self.page_no()), align="C")
        self.cell(60, 8, "", align="R")
        self.set_text_color(*BLACK)

    def section_title(self, text):
        self.ln(3)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*PURPLE)
        self.cell(0, 9, text, new_x="LMARGIN", new_y="NEXT", align="C")
        self.set_text_color(*BLACK)
        self.ln(2)

    def sub_title(self, text, color=PURPLE):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*color)
        self.cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(*BLACK)

    def body(self, text, size=10):
        self.set_font("Helvetica", "", size)
        self.set_text_color(*BLACK)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def label(self, label, value, label_color=PURPLE):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*label_color)
        self.cell(0, 6, label, new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*BLACK)
        self.set_x(self.l_margin + 5)
        self.multi_cell(175, 5.5, value)
        self.ln(1)


# ---------------------------------------------------------------------------
# FIXES.pdf — the report document
# ---------------------------------------------------------------------------
def build_fixes_pdf(out_path):
    pdf = BookStylePDF(header_text="Mathitude Quest — Fixes Report")
    pdf.add_page()

    pdf.section_title("Errors and Suggested Fixes")
    pdf.set_font("Helvetica", "I", 10)
    pdf.set_text_color(*GREY)
    pdf.cell(0, 6, "Source: QMS_BOOK.AMAZON.20220525.pdf  |  Pages reviewed: 113  |  Errors found: 11",
             new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_text_color(*BLACK)
    pdf.ln(4)

    fixes = [
        # CRITICAL
        {
            "severity": "CRITICAL",
            "page": "78",
            "title": "Mean calculation divides by 12 but dataset has 13 numbers",
            "section": "Super Stats — Mean, Median and Mode Summary",
            "current": "Dataset: 6, 5, 3, 7, 4, 1, 2, 8, 11, 9, 10, 6, 12 (13 numbers). Sum=84. "
                       "Book says 84 / 12 = 7.",
            "problem": "There are 13 observations, not 12. The sorted list shown immediately below "
                       "correctly contains 13 numbers, confirming the divisor is wrong.",
            "fix": "Replace dataset with one that genuinely sums to 84 over 12 numbers, e.g. "
                   "6, 5, 3, 7, 4, 1, 2, 8, 11, 10, 15, 12  (sum=84, n=12, mean=7). "
                   "Update the sorted list and median accordingly.",
        },
        {
            "severity": "CRITICAL",
            "page": "101",
            "title": "Answer key marks 2,793 as divisible by 9",
            "section": "Answer Key — Divisibility Rules table",
            "current": "Row for 2,793: N Y N N Y N N N  (the 'Y' in the 9-column is wrong)",
            "problem": "2 + 7 + 9 + 3 = 21, which is divisible by 3 but NOT by 9 (21 / 9 = 2.33).",
            "fix": "Change the 9-column for row 2,793 from Y to N. New row: N Y N N N N N N",
        },
        {
            "severity": "CRITICAL",
            "page": "107",
            "title": "Positively Negativity Q4 answer is wrong",
            "section": "Answer Key — Positively Negativity",
            "current": "Problem (p77):  -3^2 - (-3)^3 - (-4 - 7)^2     Answer key:  -10",
            "problem": "Correct evaluation: -9 - (-27) - 121 = -9 + 27 - 121 = -103.",
            "fix": "Change the answer key entry for Q4 from -10 to -103.",
        },
        {
            "severity": "CRITICAL",
            "page": "46",
            "title": "Q15 has identical numbers to Q14 (copy/paste)",
            "section": "Radical Ratios — Rates challenge problems",
            "current": "Q14 (cars): 675 mi / 27 gal vs 784 mi / 28 gal.  "
                       "Q15 (cupcakes): cost $675 / 27 cupcakes vs $784 / 28 cupcakes  ($25/cupcake!)",
            "problem": "Q15 still has Q14's numbers. The implied cupcake price is absurd.",
            "fix": "Replace Q15 numbers with realistic ones, e.g. Box A: $12 / 8 cupcakes; "
                   "Box B: $18 / 15 cupcakes  (Box B is the better buy at $1.20 each).",
        },

        # HIGH
        {
            "severity": "HIGH",
            "page": "52-54, 100",
            "title": "Yellow tiles referenced but diagrams show purple",
            "section": "Domino Ratios + Answer Key",
            "current": "Problems 1, 2, 3 reference 'blue:yellow:red' ratios, but the tile diagrams "
                       "and answer-key images show PURPLE tiles (no yellow anywhere).",
            "problem": "Color mismatch between text and diagrams. Students can't follow problems "
                       "that name a color not present in the artwork.",
            "fix": "Easiest: change every 'yellow' on pages 52-54 and in the page-100 answer key "
                   "to 'purple'. Alternative: recolor all purple tiles in the diagrams to yellow.",
        },
        {
            "severity": "HIGH",
            "page": "40",
            "title": "Triangle reference card is geometrically impossible",
            "section": "Geometry Concepts — Area of a Triangle example",
            "current": "Triangle drawn with sides 5, 7, base 9, perpendicular height 4, Area = 18.",
            "problem": "A 5-7-9 triangle has actual perpendicular height ~3.87 (Heron's area ~17.41). "
                       "The diagram is mathematically inconsistent.",
            "fix": "Either (A) remove the side labels '5' and '7' (the slant heights aren't needed "
                   "for the area formula anyway), or (B) replace with a clean triangle like 5-5-6 "
                   "(base 6, height 4, area 12) or a 3-4-5 right triangle.",
        },

        # MEDIUM
        {
            "severity": "MEDIUM",
            "page": "22",
            "title": "Customer 1 worked example shows wrong fraction",
            "section": "Decimals, Money Mania",
            "current": "Problem says '2/5 lb Choc Bombs' but the worked line shows  7/5 x .50 = .4 x .5 = $.20",
            "problem": "7/5 = 1.4, not 0.4. The final answer .20 only makes sense if the fraction is 2/5.",
            "fix": "Change '7/5 x .50' to '2/5 x .50'.",
        },
        {
            "severity": "MEDIUM",
            "page": "51",
            "title": "Q13 missing word 'are'",
            "section": "Percents Plus exercises",
            "current": "'...if there 20 boys and 30 girls in the class?'",
            "problem": "Grammatical error.",
            "fix": "'...if there ARE 20 boys and 30 girls in the class?'",
        },
        {
            "severity": "MEDIUM",
            "page": "99",
            "title": "Answer key Q9 missing the squared in units",
            "section": "Answer Key — Geometry Concepts",
            "current": "9. A = 8 x 6 = 48 cm",
            "problem": "Area must be in square units.",
            "fix": "9. A = 8 x 6 = 48 cm^2",
        },
        {
            "severity": "MEDIUM",
            "page": "100",
            "title": "Stray commas in Domino Ratios answer 2",
            "section": "Answer Key — Domino Ratios",
            "current": "'4 red, 8, yellow, and 12 blue squares' / '12, red, 8 yellow, and 4 blue tiles'",
            "problem": "Stray commas after '8' and '12'.",
            "fix": "'4 red, 8 yellow, and 12 blue squares' / '12 red, 8 yellow, and 4 blue tiles'  "
                   "(or replace 'yellow' with 'purple' if going with the p52-54 fix above).",
        },

        # LOW
        {
            "severity": "LOW",
            "page": "4",
            "title": "Nearly blank page with only header/footer",
            "section": "Front matter",
            "current": "Page 4 contains only the header, footer, and page number. No body content.",
            "problem": "Looks like wasted space or an unintentional blank.",
            "fix": "If intentional (print-spread spacer) leave it. Otherwise delete the page and "
                   "re-paginate, or add a section divider/illustration.",
        },
    ]

    sev_color = {
        "CRITICAL": RED,
        "HIGH": (220, 100, 0),
        "MEDIUM": BLUE,
        "LOW": GREY,
    }

    for i, fx in enumerate(fixes, start=1):
        # Pre-flight: keep each fix together if it fits
        if pdf.get_y() > 240:
            pdf.add_page()

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*sev_color[fx["severity"]])
        pdf.cell(28, 7, f"[{fx['severity']}]")
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 7, f"Page {fx['page']}  —  {fx['title']}", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)

        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(*GREY)
        pdf.cell(0, 5, f"Section: {fx['section']}", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(1)

        pdf.label("Current:", fx["current"])
        pdf.label("Problem:", fx["problem"], label_color=RED)
        pdf.label("Fix:", fx["fix"], label_color=GREEN)
        pdf.ln(3)
        pdf.set_draw_color(220, 220, 220)
        pdf.line(15, pdf.get_y(), 195, pdf.get_y())
        pdf.ln(3)

    # Summary table
    pdf.add_page()
    pdf.section_title("Summary")
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(*PURPLE)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(28, 7, "Severity", border=1, align="C", fill=True)
    pdf.cell(22, 7, "Page", border=1, align="C", fill=True)
    pdf.cell(130, 7, "Issue", border=1, align="C", fill=True)
    pdf.ln()
    pdf.set_text_color(*BLACK)
    pdf.set_font("Helvetica", "", 9)
    for fx in fixes:
        pdf.set_text_color(*sev_color[fx["severity"]])
        pdf.cell(28, 6, fx["severity"], border=1)
        pdf.set_text_color(*BLACK)
        pdf.cell(22, 6, fx["page"], border=1)
        title = fx["title"]
        if len(title) > 78:
            title = title[:75] + "..."
        pdf.cell(130, 6, title, border=1)
        pdf.ln()

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Totals: 4 Critical, 2 High, 4 Medium, 1 Low  —  11 errors total",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5.5,
                   "Recommended fix order:  (1) Critical math first — pages 46, 78, 101, 107.  "
                   "(2) Visual fixes — pages 52-54, 100, 40.  "
                   "(3) Typos — pages 22, 51, 99, 100.  "
                   "(4) Layout — page 4.")

    pdf.output(out_path)
    print(f"Wrote {out_path}")


# ---------------------------------------------------------------------------
# FIXES_APPLIED.pdf — each fix on its own page, formatted as a faithful
# replacement of the original Mathitude page it would swap into the book.
# ---------------------------------------------------------------------------
class ReplacementPagePDF(FPDF):
    """Mimics the actual Mathitude page layout (one page = one book page).

    Page-number labels are looked up per physical page from `self.page_labels`,
    which is keyed by 1-based PDF page number. This avoids off-by-one errors
    caused by FPDF calling footer() during the *previous* page's close-out.
    """

    def __init__(self):
        super().__init__()
        self.page_labels = {}  # {pdf_page_no: book_page_label}
        self.set_auto_page_break(auto=True, margin=22)

    def header(self):
        # Top: small purple "M" badge on left, big centered title in purple
        self.set_xy(15, 12)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*PURPLE)
        self.cell(15, 10, "M", align="C", border=0)
        self.set_xy(15, 12)
        self.set_font("Helvetica", "B", 22)
        self.cell(0, 14, _ascii("Middle School Math Quest"), align="C",
                  new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(*BLACK)
        self.set_y(28)

    def footer(self):
        self.set_y(-18)
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(*PURPLE)
        page_w = self.w - 2 * self.l_margin
        third = page_w / 3
        label = self.page_labels.get(self.page_no(), str(self.page_no()))
        self.cell(third, 8, "Copyright (c) 2022 by Mathitude.com", align="L")
        self.cell(third, 8, label, align="C")
        self.cell(third, 8, "", align="R")
        self.set_text_color(*BLACK)

    def cell(self, *args, **kwargs):
        if len(args) >= 3 and isinstance(args[2], str):
            args = list(args)
            args[2] = _ascii(args[2])
        if "text" in kwargs:
            kwargs["text"] = _ascii(kwargs["text"])
        if "txt" in kwargs:
            kwargs["txt"] = _ascii(kwargs["txt"])
        return super().cell(*args, **kwargs)

    def multi_cell(self, *args, **kwargs):
        if len(args) >= 3 and isinstance(args[2], str):
            args = list(args)
            args[2] = _ascii(args[2])
        if "text" in kwargs:
            kwargs["text"] = _ascii(kwargs["text"])
        if "txt" in kwargs:
            kwargs["txt"] = _ascii(kwargs["txt"])
        return super().multi_cell(*args, **kwargs)

    def section_heading(self, text):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*PURPLE)
        self.cell(0, 10, text, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(*BLACK)
        self.ln(3)

    def body(self, text, size=11):
        self.set_font("Helvetica", "", size)
        self.set_text_color(*BLACK)
        self.multi_cell(0, 6, text)

    def fix_note(self, text):
        """Small green annotation at the bottom of the replacement page."""
        self.ln(4)
        self.set_draw_color(*GREEN)
        self.set_line_width(0.2)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(2)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*GREEN)
        self.multi_cell(0, 4, "ERRATA: " + text)
        self.set_text_color(*BLACK)


def build_fixes_applied_pdf(out_path):
    """Each book page that has an error gets a faithfully formatted replacement page."""

    # We build each replacement page as its own PDF then merge by writing them
    # one after another into a single fpdf doc that re-uses the same header/footer.
    # Easiest path: build a single fpdf with a per-page footer label that
    # changes per page using a queue.
    pages = []  # list of (book_page_label, render_fn)

    # ---- p22 ----
    def p22(pdf):
        pdf.section_heading("Decimals, Money Mania")
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6,
            "Fitz's Candy Store needs your help. His cash register and calculators are all "
            "broken, and he needs to know how much each customer owes him. Can you calculate "
            "the total each customer owes? Fitz calculated the first one for you.")
        pdf.ln(3)

        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 7, "CANDY STORE PRICES", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(1)

        # Price table, centered
        table_w = 120
        x_start = (pdf.w - table_w) / 2
        pdf.set_x(x_start)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(240, 235, 250)
        pdf.cell(80, 7, "Candy", border=1, fill=True)
        pdf.cell(40, 7, "Price per lb", border=1, fill=True)
        pdf.ln()
        pdf.set_font("Helvetica", "", 11)
        for name, price in [("Lemon Bees", "$2.25"), ("Chocolate Bombs", "50 c"),
                            ("Pizza Gummies", "$1.50"), ("Sour Fizzes", "$1.00")]:
            pdf.set_x(x_start)
            pdf.cell(80, 7, name, border=1)
            pdf.cell(40, 7, price, border=1)
            pdf.ln()
        pdf.ln(4)

        # Customer 1 — corrected
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 7, "Customer 1", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(0, 6, "2/5 lb Choc Bombs", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*RED)
        pdf.cell(0, 6, "   = 2/5 x .50 = .4 x .5 = $.20", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.cell(0, 6, "3 1/2 lbs Sour Fizzes", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*RED)
        pdf.cell(0, 6, "   = 3.5 x 1 = $3.50", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.cell(0, 6, "1/2 lb Pizza Gummies", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*RED)
        pdf.cell(0, 6, "   = .5 x 1.5 = $0.75", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 8, "TOTAL = $4.45", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.fix_note("Page 22, Customer 1 line 1: changed '7/5 x .50' to '2/5 x .50' "
                     "to match the problem statement (2/5 lb Choc Bombs).")

    pages.append(("22", p22))

    # ---- p40 ----
    def p40(pdf):
        pdf.section_heading("Geometry Concepts")
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 8, "Area of a Triangle", align="C", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(1)
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 7, "    A = (base x height) / 2  =  bh / 2",
                 new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6, "Use the right-angle (perpendicular) height, NOT the slant height.")
        pdf.ln(4)

        # Draw a clean 5-5-6 isosceles triangle
        cx, cy = pdf.w / 2, pdf.get_y() + 35
        # base from (cx-30, cy) to (cx+30, cy), apex at (cx, cy-40)
        pdf.set_draw_color(*PURPLE)
        pdf.set_line_width(0.6)
        pdf.line(cx - 30, cy, cx + 30, cy)             # base
        pdf.line(cx - 30, cy, cx,      cy - 40)        # left side
        pdf.line(cx + 30, cy, cx,      cy - 40)        # right side
        pdf.set_draw_color(*GREEN)
        pdf.set_line_width(0.4)
        pdf.line(cx, cy, cx, cy - 40)                  # height
        # right-angle marker
        pdf.set_draw_color(*GREEN)
        pdf.line(cx, cy - 4, cx + 4, cy - 4)
        pdf.line(cx + 4, cy - 4, cx + 4, cy)

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*PURPLE)
        pdf.text(cx - 50, cy - 20, "5")
        pdf.text(cx + 46, cy - 20, "5")
        pdf.set_text_color(*GREEN)
        pdf.text(cx + 6, cy - 20, "4")
        pdf.set_text_color(*PURPLE)
        pdf.text(cx - 4, cy + 6, "6")

        pdf.set_y(cy + 14)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*BLACK)
        pdf.cell(0, 7, "Area = (6 x 4) / 2 = 12 square units",
                 new_x="LMARGIN", new_y="NEXT", align="C")

        pdf.fix_note("Page 40, Area-of-Triangle example: replaced the impossible "
                     "5-7-9 triangle with a clean 5-5-6 isosceles triangle whose "
                     "actual perpendicular height from the base of 6 is exactly 4.")

    pages.append(("40", p40))

    # ---- p46 ----
    def p46(pdf):
        pdf.section_heading("Radical Ratios")
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 7, "Try these ratio challenge problems. Think carefully and use all "
                       "the tools you've learned.", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6, "14.  Which car gets better gas mileage?")
        pdf.ln(1)

        # Q14 table
        x14 = 25
        pdf.set_x(x14)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(*PURPLE)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(50, 7, "Car", border=1, fill=True)
        pdf.cell(25, 7, "A", border=1, align="C", fill=True)
        pdf.cell(25, 7, "B", border=1, align="C", fill=True)
        pdf.ln()
        pdf.set_text_color(*BLACK)
        pdf.set_font("Helvetica", "", 11)
        for label, a, b in [("Distance (miles)", "675", "784"),
                            ("Gallons Used", "27", "28")]:
            pdf.set_x(x14)
            pdf.cell(50, 7, label, border=1)
            pdf.cell(25, 7, a, border=1, align="C")
            pdf.cell(25, 7, b, border=1, align="C")
            pdf.ln()
        pdf.ln(4)

        pdf.multi_cell(0, 6, "15.  Which is the better buy, Box A or B?")
        pdf.ln(1)

        # Q15 corrected table
        x15 = 25
        pdf.set_x(x15)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_fill_color(*PURPLE)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(50, 7, "Cupcakes", border=1, fill=True)
        pdf.cell(25, 7, "Box A", border=1, align="C", fill=True)
        pdf.cell(25, 7, "Box B", border=1, align="C", fill=True)
        pdf.ln()
        pdf.set_text_color(*BLACK)
        pdf.set_font("Helvetica", "", 11)
        for label, a, b in [("Cost (dollars)", "12", "18"),
                            ("Number of Cupcakes", "8", "15")]:
            pdf.set_x(x15)
            pdf.cell(50, 7, label, border=1)
            pdf.set_text_color(*RED)
            pdf.cell(25, 7, a, border=1, align="C")
            pdf.cell(25, 7, b, border=1, align="C")
            pdf.set_text_color(*BLACK)
            pdf.ln()

        pdf.fix_note("Page 46, Q15: replaced the copy/paste numbers (which were "
                     "identical to Q14 and implied $25/cupcake) with realistic values. "
                     "Box A = $1.50/cupcake, Box B = $1.20/cupcake -> Box B is the better buy.")

    pages.append(("46", p46))

    # ---- p51 ----
    def p51(pdf):
        pdf.section_heading("Percents Plus (continued)")
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "Use your new percentage skills to solve these problems.",
                 new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)
        pdf.set_font("Helvetica", "", 11)
        items = ["1.   75% of 120", "2.  80% of 60", "3.  90% of 50",
                 "4.  60 is 40% of what number?", "5.  150% of 40",
                 "6.  5% of 120", "7.  200% of 30", "8.  10 is 25% of what number?",
                 "9.  30 is what percent of 50?", "10.  120 is what percent of 90?",
                 "11.  80 is what percent of 200?", "12.  25 is what percent of 5?"]
        for it in items:
            pdf.cell(0, 7, it, new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        pdf.set_text_color(*RED)
        pdf.multi_cell(0, 7,
            "13.  If 40% of the boys and 30% of the girls in a class like baseball, "
            "how many students like baseball if there ARE 20 boys and 30 girls in "
            "the class?")
        pdf.set_text_color(*BLACK)

        pdf.fix_note("Page 51, Q13: added the missing word 'are' "
                     "(originally read 'if there 20 boys').")

    pages.append(("51", p51))

    # ---- p52 (Domino Ratios opener) ----
    def p52(pdf):
        pdf.section_heading("Domino Ratios")
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6,
            "Now that you've learned about ratios let's apply them to some puzzles. "
            "In the example we have purple, red, and blue tiles. Use them to solve "
            "the puzzles below.")
        pdf.ln(4)
        pdf.set_text_color(*RED)
        pdf.multi_cell(0, 7,
            "1. Using these tiles, make a 2:5:7 blue:PURPLE:red ratio. In addition, "
            "make sure all blue squares touch each other. You can use as many of each "
            "tile as you want, just make sure all the white squares get filled in. "
            "You cannot fill in the grey squares - they remain blank for all of "
            "these challenges.")
        pdf.set_text_color(*BLACK)

        pdf.fix_note("Pages 52-54, problems 1, 2 and 3: every reference to 'yellow' "
                     "was replaced with 'PURPLE' to match the actual tile colors "
                     "shown in the diagrams (the example on page 52 establishes "
                     "purple/red/blue as the palette).")

    pages.append(("52", p52))

    # ---- p53 (Domino Ratios continued) ----
    def p53(pdf):
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(*RED)
        pdf.multi_cell(0, 7,
            "2. Using the tiles on the right, fill in the top half so it has a "
            "1:2:3 ratio of red, PURPLE, and blue. Then, can you fill in the bottom "
            "half to make a 3:2:1 ratio of red, PURPLE, and blue using the same tiles?")
        pdf.ln(4)
        pdf.multi_cell(0, 7,
            "3. Make a 1:2:6 ratio of blue, PURPLE, and red using these larger tiles.")
        pdf.set_text_color(*BLACK)

        pdf.fix_note("Page 53, problems 2 and 3: 'yellow' replaced with 'PURPLE'.")

    pages.append(("53", p53))

    # ---- p78 ----
    def p78(pdf):
        pdf.section_heading("Super Stats")
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6,
            "You may have already learned how to calculate the mean, median, and "
            "mode of a data set. But, some schools don't cover these topics until "
            "6th grade, or later, so we'll review the topics and give you some "
            "cool challenges.")
        pdf.ln(3)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 8, "Mean, Median and Mode Summary", align="C",
                 new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(1)
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, "Example Dataset:  6, 5, 3, 7, 4, 1, 2, 8, 11, 10, 15, 12",
                 new_x="LMARGIN", new_y="NEXT", align="C")
        pdf.ln(2)

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 7, "Mean (Average)", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6,
            "Add all the observations together and divide by the number of observations.\n\n"
            "Add 6 + 5 + 3 + 7 + 4 + 1 + 2 + 8 + 11 + 10 + 15 + 12.\n"
            "These observations sum to 84.\n"
            "We divide this total by the number of observations: (84 / 12 = 7).",
            new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(pdf.l_margin)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*RED)
        pdf.multi_cell(0, 7, "The mean, or average, is 7 for this dataset.",
                       new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(2)

        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 7, "Median", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6,
            "Sort the data: 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 15. "
            "There are 12 numbers (even count), so the median is the average of "
            "the 6th and 7th values: (6 + 7) / 2 = 6.5.")

        pdf.fix_note("Page 78, Mean example: original printed dataset had 13 numbers "
                     "but the calculation divided by 12. Dataset replaced with one "
                     "that genuinely has 12 numbers summing to 84, preserving the "
                     "clean integer mean of 7. Median updated accordingly.")

    pages.append(("78", p78))

    # ---- p99 ----
    def p99(pdf):
        pdf.section_heading("Answer Key")
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 8, "Geometry Concepts (pp. 41-43)",
                 new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(1)
        pdf.set_font("Helvetica", "", 11)
        col_w = 90
        rows = [
            ("1. q = 60 deg", "9. A = 8 x 6 = 48 cm^2"),
            ("2. p = 25 deg, q = 155 deg, r = 65 deg", "      The average of the bases is the same"),
            ("3. q = 60 deg, Triangle: Equilateral", "      thing as (1/2)(b1 + b2)."),
            ("4. q = 80 deg, Triangle: Isosceles", "10. A = (1/2) x 12 x 6 = 36"),
            ("5. q = 30 deg, Triangle: Scalene", "11. A = (1/2)(14 + 18) x 11 = 176"),
            ("6. 12 meters long", "12. A = 9 x 7 = 63"),
            ("7. 8 millimeters", "13. SA = 2(4x6 + 4x8 + 6x8) = 208"),
            ("8. 50 x $1.93 = $96.50", "14. V = 4 x 6 x 8 = 192"),
        ]
        for left, right in rows:
            pdf.cell(col_w, 6, left)
            if "48 cm^2" in right:
                pdf.set_text_color(*RED)
                pdf.cell(0, 6, right, new_x="LMARGIN", new_y="NEXT")
                pdf.set_text_color(*BLACK)
            else:
                pdf.cell(0, 6, right, new_x="LMARGIN", new_y="NEXT")

        pdf.fix_note("Page 99, Geometry Q9 answer: added the squared in the units "
                     "(was '48 cm', now '48 cm^2'). Area is always in square units.")

    pages.append(("99", p99))

    # ---- p100 ----
    def p100(pdf):
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 8, "Domino Ratios (pp. 52-54)", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 11)
        pdf.set_text_color(*RED)
        pdf.multi_cell(0, 7,
            "1. This is just one possible answer. However, your solution must have "
            "4 blue, 10 PURPLE, and 14 red squares.")
        pdf.ln(2)
        pdf.multi_cell(0, 7,
            "2. Here's one answer. Make sure your top half has 4 red, 8 PURPLE, "
            "and 12 blue squares while your bottom half should have 12 red, "
            "8 PURPLE, and 4 blue tiles.")
        pdf.ln(2)
        pdf.multi_cell(0, 7,
            "3. Your solution may look different, but you should have 5 blue, "
            "10 PURPLE, and 30 red squares.")
        pdf.ln(2)
        pdf.set_text_color(*BLACK)
        pdf.multi_cell(0, 7,
            "4. The maximum number of red spaces is 22. This solution has a "
            "11:6:5 ratio of red:green:blue.")

        pdf.fix_note("Page 100: removed stray commas after '8' and '12' in answer 2, "
                     "and replaced every 'yellow' with 'PURPLE' (answers 1, 2 and 3) "
                     "to match the actual tile colors shown in the diagrams on "
                     "pages 52-54.")

    pages.append(("100", p100))

    # ---- p101 ----
    def p101(pdf):
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 8, "Divisibility Rules (pp. 61-62)", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5.5,
            "Showing only the corrected row from the Divisibility Practice "
            "answer table. The 9-column for 2,793 is now N (was incorrectly "
            "shown as Y in the first printing).")
        pdf.ln(3)

        # Header row
        col_widths = [26, 14, 14, 14, 14, 14, 14, 14, 14]
        headers = ["Number", "2", "3", "4", "6", "9", "15", "18", "24"]
        x_table = (pdf.w - sum(col_widths)) / 2
        pdf.set_x(x_table)
        pdf.set_fill_color(*PURPLE)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 11)
        for w, h in zip(col_widths, headers):
            pdf.cell(w, 8, h, border=1, align="C", fill=True)
        pdf.ln()

        # 2,793 row
        pdf.set_text_color(*BLACK)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_x(x_table)
        pdf.cell(col_widths[0], 8, "2,793", border=1, align="C")
        # answers in order: 2,3,4,6,9,15,18,24
        cells = [
            ("N", BLACK), ("Y", GREEN), ("N", BLACK), ("N", BLACK),
            ("N", RED),   ("N", BLACK), ("N", BLACK), ("N", BLACK),
        ]
        for (val, color), w in zip(cells, col_widths[1:]):
            pdf.set_text_color(*color)
            pdf.cell(w, 8, val, border=1, align="C")
        pdf.set_text_color(*BLACK)
        pdf.ln(12)

        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6,
            "Why: 2 + 7 + 9 + 3 = 21. 21 is divisible by 3 (so the 3-column is Y) "
            "but NOT by 9 (21 / 9 = 2.33), so the 9-column must be N. The other "
            "columns are unchanged.")

        pdf.fix_note("Page 101, divisibility table row for 2,793: changed the "
                     "9-column from Y to N. The number is divisible by 3 but not by 9.")

    pages.append(("101", p101))

    # ---- p107 ----
    def p107(pdf):
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(*PURPLE)
        pdf.cell(0, 8, "Positively Negativity (p. 77)", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 11)
        col_w = 60
        answers = [
            ("1.  -22", "5.  -3", "9.   30"),
            ("2.  14/3", "6.  -5/16", "10.  -1"),
            ("3.  55", "7.  80", "11.  0.8"),
            ("",       "8.  -4", "12.  16"),
        ]
        # Q4 gets its own highlighted line
        for row in answers:
            for cell in row:
                pdf.cell(col_w, 7, cell)
            pdf.ln()
        pdf.ln(2)
        pdf.set_text_color(*RED)
        pdf.set_font("Helvetica", "B", 12)
        pdf.cell(0, 8, "4.  -103", new_x="LMARGIN", new_y="NEXT")
        pdf.set_text_color(*BLACK)
        pdf.ln(2)
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6,
            "Step-by-step for Q4:    -3^2 - (-3)^3 - (-4 - 7)^2\n"
            "                          = -9 - (-27) - (-11)^2\n"
            "                          = -9 + 27 - 121\n"
            "                          = 18 - 121\n"
            "                          = -103")

        pdf.fix_note("Page 107, Positively Negativity Q4: corrected answer from "
                     "-10 to -103. Step-by-step shown above.")

    pages.append(("107", p107))

    # ---- Render every replacement page into the same doc ----
    pdf = ReplacementPagePDF()
    for i, (label, render_fn) in enumerate(pages, start=1):
        pdf.page_labels[i] = label
        pdf.add_page()
        render_fn(pdf)

    pdf.output(out_path)
    print(f"Wrote {out_path}  ({len(pages)} replacement pages)")


if __name__ == "__main__":
    build_fixes_pdf("/Users/ari/GitHub/paula/books/FIXES.pdf")
    build_fixes_applied_pdf("/Users/ari/GitHub/paula/books/FIXES_APPLIED.pdf")
