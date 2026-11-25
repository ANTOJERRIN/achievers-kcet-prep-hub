import json
import re
from html.parser import HTMLParser
from urllib.error import URLError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import urlopen

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator


def validate_resource_url(value):
    URLValidator(schemes=["https"])(value)
    address = urlsplit(value)
    if address.username is not None or address.password is not None:
        raise ValidationError("Enter a public HTTPS link without credentials.")


def youtube_video_id(value):
    try:
        validate_resource_url(value)
    except ValidationError:
        return None
    address = urlsplit(value)
    if address.hostname == "youtu.be":
        candidate = address.path.strip("/")
    elif address.hostname in {"youtube.com", "www.youtube.com", "m.youtube.com"}:
        path = address.path.strip("/")
        if path == "watch":
            candidate = parse_qs(address.query).get("v", [""])[0]
        elif path.startswith(("shorts/", "live/", "embed/")):
            candidate = path.split("/", 1)[1]
        else:
            return None
    else:
        return None
    return candidate if re.fullmatch(r"[A-Za-z0-9_-]{11}", candidate) else None


def youtube_metadata(video_id):
    # Take only the title and channel name from YouTube's public metadata.
    query = urlencode({"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"})
    try:
        with urlopen(f"https://www.youtube.com/oembed?{query}", timeout=5) as response:
            data = json.loads(response.read(32_768))
        title = data["title"].strip()
        channel = data["author_name"].strip()
        if not title or not channel:
            raise ValueError("Missing YouTube metadata")
    except (URLError, OSError, ValueError, TypeError, KeyError, AttributeError) as error:
        raise ValidationError("YouTube details could not be loaded. Enter a title and source manually.") from error
    return title[:200], channel[:120]


def openstax_page(value):
    try:
        validate_resource_url(value)
    except ValidationError:
        return None
    address = urlsplit(value)
    if address.hostname in {"openstax.org", "www.openstax.org"} and re.fullmatch(
        r"/books/[a-z0-9-]+/pages/[a-z0-9-]+/?", address.path,
    ):
        return address.path
    return None


class PageTitle(HTMLParser):
    title = ""

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "meta" and values.get("property") == "og:title" and values.get("content"):
            self.title = values["content"].strip().removesuffix(" | OpenStax")


def openstax_metadata(path):
    try:
        with urlopen(f"https://openstax.org{path}", timeout=5) as response:
            parser = PageTitle()
            parser.feed(response.read(131_072).decode("utf-8", errors="replace"))
        if not parser.title:
            raise ValueError("Missing OpenStax page title")
    except (URLError, OSError, ValueError) as error:
        raise ValidationError("OpenStax details could not be loaded. Enter a title and source manually.") from error
    return parser.title[:200], "OpenStax"
