from django.core.management.base import BaseCommand
from django.db import transaction

from prep.models import LearningResource, Topic


SOURCES = {
    "thermodynamics": [
        ("reading", "First law of thermodynamics", "OpenStax",
         "https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics"),
        ("video", "First and second laws of thermodynamics", "Khan Academy on YouTube",
         "https://www.youtube.com/watch?v=f1OokOgtcqg"),
    ],
    "waves": [
        ("reading", "Simple harmonic motion", "OpenStax",
         "https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion"),
        ("video", "Introduction to harmonic motion", "Khan Academy",
         "https://www.khanacademy.org/v/introduction-to-harmonic-motion"),
    ],
    "chemical-bonding": [
        ("reading", "Molecular structure and polarity", "OpenStax",
         "https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity"),
        ("video", "Molecular geometry and VSEPR", "Khan Academy",
         "https://www.khanacademy.org/science/hs-chemistry-tx/x1ff71253c4e4a747%3Achemical-bonding/x1ff71253c4e4a747%3Aelectronegativity-and-bond-polarity/v/molecular-geometry-vsepr-theory"),
    ],
    "organic-chemistry": [
        ("reading", "Functional groups", "OpenStax",
         "https://openstax.org/books/organic-chemistry/pages/3-1-functional-groups"),
        ("video", "Identifying functional groups", "Khan Academy on YouTube",
         "https://www.youtube.com/watch?v=esJ5MbAHswc"),
    ],
    "calculus": [
        ("reading", "Differentiation rules", "OpenStax",
         "https://openstax.org/books/calculus-volume-1/pages/3-3-differentiation-rules"),
        ("video", "The power rule", "Khan Academy on YouTube",
         "https://www.youtube.com/watch?v=bRZmfc1YFsQ"),
    ],
    "coordinate-geometry": [
        ("reading", "Distance and midpoint formulas", "OpenStax",
         "https://openstax.org/books/intermediate-algebra-2e/pages/11-1-distance-and-midpoint-formulas-circles"),
        ("video", "Using the distance formula", "Khan Academy",
         "https://www.khanacademy.org/math/geometry/geometry-basics/geometry-basics/v/distance-formula"),
    ],
}


class Command(BaseCommand):
    help = "Add published online readings and video tutorials to existing starter topics."

    @transaction.atomic
    def handle(self, *args, **options):
        topics = Topic.objects.in_bulk(SOURCES, field_name="slug")
        created = 0
        for slug, links in SOURCES.items():
            if slug not in topics:
                self.stdout.write(self.style.WARNING(f"Skipped missing topic: {slug}"))
                continue
            for kind, title, source, url in links:
                _, added = LearningResource.objects.get_or_create(
                    topic=topics[slug], url=url,
                    defaults={"kind": kind, "title": title, "source": source, "published": True},
                )
                created += int(added)
        self.stdout.write(self.style.SUCCESS(f"Added {created} online learning resources."))
