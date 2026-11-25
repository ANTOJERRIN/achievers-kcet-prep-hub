import { ExternalLink } from "lucide-react";
import type { LearningResource } from "@/lib/prep-api";

export function OnlineResources({ topic, resources, kind }: {
  topic: string;
  resources: LearningResource[];
  kind?: LearningResource["kind"];
}) {
  const links = kind ? resources.filter((resource) => resource.kind === kind) : resources;
  const videos = "https://www.youtube.com/results?" + new URLSearchParams({
    search_query: `KCET ${topic} Class 11 12 tutorial`,
  });
  const readings = "https://www.google.com/search?" + new URLSearchParams({
    q: `${topic} (site:openstax.org OR site:khanacademy.org)`,
  });

  return (
    <div className="space-y-2">
      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((resource) => (
            <li key={resource.id}>
              <a href={resource.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                <span>
                  <span className="block font-medium">{resource.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {resource.kind === "video" ? "Video" : "Reading"} · {resource.source}
                  </span>
                </span>
                <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {kind !== "reading" && (
          <a href={videos} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Find more on YouTube
          </a>
        )}
        {kind !== "video" && (
          <a href={readings} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Find more readings
          </a>
        )}
      </div>
    </div>
  );
}
