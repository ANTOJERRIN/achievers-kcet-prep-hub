from django.core.management.base import BaseCommand
from django.db import transaction

from prep.models import Lesson, Question, Quiz, Subject, Topic

# Original starter questions. Index values identify A, B, C, D in order.
CONTENT = [
    ("physics", "Physics", "thermodynamics", "Thermodynamics",
     "Using the work-done-by-the-gas convention, the first law is ΔU = Q − W. "
     "For an ideal gas, internal energy depends on temperature. In a complete cycle ΔU = 0.",
     [
         ("A gas absorbs 140 J and does 60 J of work. What is ΔU?",
          ("200 J", "80 J", "−80 J", "60 J"), 1, "ΔU = 140 − 60 = 80 J."),
         ("What is ΔU for a complete thermodynamic cycle?",
          ("Zero", "Always positive", "Always negative", "Equal to heat input"), 0,
          "Internal energy is a state function and the system returns to its initial state."),
         ("An ideal gas expands isothermally and does work. What happens to its internal energy?",
          ("Increases", "Decreases", "Stays constant", "Cannot be inferred"), 2,
          "An ideal gas's internal energy depends only on temperature, which stays constant."),
     ]),
    ("physics", "Physics", "waves", "Waves & Oscillations",
     "Wave speed is frequency times wavelength. For simple harmonic motion, acceleration points "
     "toward equilibrium and is proportional to displacement. A spring's period scales with the square root of mass.",
     [
         ("A 20 Hz wave has a wavelength of 3 m. What is its speed?",
          ("6.7 m/s", "23 m/s", "60 m/s", "120 m/s"), 2, "v = fλ = 20 × 3 = 60 m/s."),
         ("Where is the magnitude of acceleration largest in simple harmonic motion?",
          ("At equilibrium", "At either extreme", "Everywhere equally", "Halfway to equilibrium"), 1,
          "The magnitude of acceleration is proportional to distance from equilibrium."),
         ("What happens to a mass–spring oscillator's period if its mass is quadrupled?",
          ("It doubles", "It quadruples", "It halves", "It stays the same"), 0,
          "T = 2π√(m/k), so multiplying mass by four multiplies the period by two."),
     ]),
    ("chemistry", "Chemistry", "chemical-bonding", "Chemical Bonding",
     "Electron pairs around a central atom determine molecular geometry. Lone pairs affect bond angles. "
     "A molecule's net polarity depends on both bond polarity and molecular symmetry.",
     [
         ("What is the molecular shape of ammonia (NH₃)?",
          ("Linear", "Trigonal planar", "Bent", "Trigonal pyramidal"), 3,
          "Nitrogen has three bonding pairs and one lone pair, giving a trigonal pyramidal shape."),
         ("What is the bond angle between the equivalent C–O bonds of carbon dioxide?",
          ("90°", "109.5°", "120°", "180°"), 3, "CO₂ is a linear molecule."),
         ("Which example relies primarily on ionic bonding?",
          ("NaCl", "CH₄", "N₂", "Cl₂"), 0, "The attraction between Na⁺ and Cl⁻ is ionic."),
     ]),
    ("chemistry", "Chemistry", "organic-chemistry", "Organic Chemistry",
     "Recognise functional groups before naming or predicting reactions. An alcohol has an –OH group on a "
     "saturated carbon, and an aldehyde has a terminal –CHO group. Alkenes contain a C=C bond.",
     [
         ("Which group identifies an aldehyde?",
          ("–COOH", "–CHO", "–O–", "–NH₂"), 1, "An aldehyde contains a terminal carbonyl group bonded to hydrogen."),
         ("What is the molecular formula of propene?",
          ("C₃H₈", "C₂H₄", "C₃H₆", "C₃H₄"), 2, "Acyclic alkenes with one double bond follow CₙH₂ₙ."),
         ("What is the IUPAC name of CH₃CH₂OH?",
          ("Ethanal", "Methanol", "Ethanol", "Ethanoic acid"), 2,
          "The two-carbon chain gives eth-, and its alcohol group gives -ol."),
     ]),
    ("mathematics", "Mathematics", "calculus", "Calculus",
     "Differentiate powers with d(xⁿ)/dx = nxⁿ⁻¹. A derivative measures instantaneous change. "
     "Use the chain rule to differentiate an outer function composed with an inner function.",
     [
         ("What is the derivative of x³ + 2x?",
          ("3x² + 2", "x² + 2", "3x + 2", "3x²"), 0, "Apply the power rule to each term."),
         ("What is the derivative of sin(2x) when x is measured in radians?",
          ("cos(2x)", "2 sin(2x)", "−2 cos(2x)", "2 cos(2x)"), 3,
          "Differentiate the sine and multiply by the derivative of 2x."),
         ("What is the slope of y = x² at x = 3?",
          ("3", "6", "9", "12"), 1, "The slope is 2x, which is 6 when x = 3."),
     ]),
    ("mathematics", "Mathematics", "coordinate-geometry", "Coordinate Geometry",
     "For nonvertical lines, slope is the change in y divided by the change in x. "
     "Use the distance formula from Pythagoras and the average of each coordinate for the midpoint.",
     [
         ("What is the slope of the line through (1, 2) and (3, 8)?",
          ("2", "3", "4", "6"), 1, "The slope is (8 − 2) / (3 − 1) = 3."),
         ("What is the distance between (0, 0) and (3, 4)?",
          ("5", "6", "7", "25"), 0, "The distance is √(3² + 4²) = 5."),
         ("What is the midpoint of (2, −2) and (6, 4)?",
          ("(8, 2)", "(2, 4)", "(4, 1)", "(4, 2)"), 2, "Average each coordinate separately."),
     ]),
]


class Command(BaseCommand):
    help = "Add original starter lessons and quizzes for the three KCET subjects."

    @transaction.atomic
    def handle(self, *args, **options):
        order = {"physics": 1, "chemistry": 2, "mathematics": 3}
        for position, (subject_slug, name, slug, title, note, items) in enumerate(CONTENT):
            subject, _ = Subject.objects.get_or_create(
                slug=subject_slug, defaults={"name": name, "position": order[subject_slug]},
            )
            topic, _ = Topic.objects.get_or_create(
                slug=slug, defaults={"subject": subject, "title": title, "position": position},
            )
            Lesson.objects.get_or_create(
                topic=topic, title=f"{title} essentials", defaults={"body": note, "published": True},
            )
            quiz, created = Quiz.objects.get_or_create(
                topic=topic, title=f"{title} starter practice",
                defaults={"duration_seconds": 180, "published": True},
            )
            if created:
                for index, (prompt, choices, correct, explanation) in enumerate(items, start=1):
                    Question.objects.create(
                        quiz=quiz, position=index, prompt=prompt,
                        option_a=choices[0], option_b=choices[1], option_c=choices[2], option_d=choices[3],
                        correct_index=correct, explanation=explanation,
                    )
        self.stdout.write(self.style.SUCCESS("KCET starter content is ready."))
