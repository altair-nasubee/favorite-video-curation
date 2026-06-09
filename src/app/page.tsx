import { requireUser } from "@/lib/auth-helpers";
import { getVideoListForUser } from "@/lib/videos";
import { Header } from "@/components/Header";
import { CategorySection } from "@/components/CategorySection";

export default async function HomePage() {
  const session = await requireUser();
  const sections = await getVideoListForUser(session.user.id);

  return (
    <>
      <Header />
      <main className="shell page">
        <div className="page-head">
          <p className="page-head__eyebrow">the collection</p>
          <h1 className="page-head__title">
            とっておきの<em>試写室</em>
          </h1>
          <p className="page-head__lead">
            カテゴリごとに整理された作品を、サムネイルから直接再生できます。
            未視聴・高評価のセクションは自動で更新されます。
          </p>
        </div>

        {sections.length === 0 ? (
          <div className="empty">
            まだ動画が登録されていません。管理者が作品を追加するとここに並びます。
          </div>
        ) : (
          sections.map((section, i) => (
            <CategorySection key={section.key} section={section} order={i} />
          ))
        )}
      </main>
    </>
  );
}
