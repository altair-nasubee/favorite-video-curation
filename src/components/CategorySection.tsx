import type { CategorySection as Section } from "@/lib/videos";
import { HIGH_RATED_KEY, UNWATCHED_KEY } from "@/lib/videos";
import { VideoCard } from "./VideoCard";

function romanIndex(n: number): string {
  return String(n + 1).padStart(2, "0");
}

export function CategorySection({
  section,
  order,
}: {
  section: Section;
  order: number;
}) {
  const isVirtual =
    section.key === UNWATCHED_KEY || section.key === HIGH_RATED_KEY;

  return (
    <section className={`section${isVirtual ? " section--virtual" : ""}`}>
      <div className="section__head">
        <span className="section__index">{romanIndex(order)}</span>
        <h2 className="section__title">{section.title}</h2>
        <span className="section__count">{section.videos.length} 本</span>
      </div>
      <div className="grid">
        {section.videos.map((v, i) => (
          <VideoCard key={`${section.key}-${v.id}`} video={v} index={i} />
        ))}
      </div>
    </section>
  );
}
