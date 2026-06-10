import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getAdminVideoList } from "@/lib/videos";
import { thumbnailUrl } from "@/lib/youtube";
import { Header } from "@/components/Header";
import { PlusIcon } from "@/components/icons";

export default async function AdminPage() {
  await requireUser();
  const sections = await getAdminVideoList();

  return (
    <>
      <Header />
      <main className="shell page">
        <div className="toolbar">
          <div>
            <p className="page-head__eyebrow">administration</p>
            <h1 className="page-head__title" style={{ fontSize: "2.2rem" }}>
              動画の管理
            </h1>
          </div>
          <Link href="/admin/videos/new" className="btn btn--gold">
            <PlusIcon /> Add Video
          </Link>
        </div>

        {sections.length === 0 ? (
          <div className="empty">
            まだ動画がありません。[Add Video] から登録してください。
          </div>
        ) : (
          sections.map((section) => (
            <section className="section" key={section.category}>
              <div className="section__head">
                <h2 className="section__title">{section.category}</h2>
                <span className="section__count">
                  {section.videos.length} 本
                </span>
              </div>
              <div className="admin-list">
                {section.videos.map((v) => (
                  <Link
                    key={v.id}
                    href={`/admin/videos/${v.id}`}
                    className="admin-row"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="admin-row__thumb"
                      src={thumbnailUrl(v.youtubeVideoId, "mqdefault")}
                      alt=""
                      width={96}
                      height={54}
                      loading="lazy"
                    />
                    <div>
                      <div className="admin-row__title">{v.title}</div>
                      <div className="admin-row__sub">
                        {v.createdAt.toLocaleDateString("ja-JP")} ・{" "}
                        {v.youtubeVideoId}
                      </div>
                    </div>
                    <span
                      className={`pill ${v.isPublic ? "pill--public" : "pill--private"}`}
                    >
                      {v.isPublic ? "公開" : "非公開"}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </>
  );
}
