import { requireAdmin } from "@/lib/auth-helpers";
import { getCategories } from "@/lib/videos";
import { createVideo } from "@/actions/video-actions";
import { Header } from "@/components/Header";
import { VideoForm } from "@/components/VideoForm";

export default async function NewVideoPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <>
      <Header />
      <main className="shell page">
        <div className="page-head">
          <p className="page-head__eyebrow">administration</p>
          <h1 className="page-head__title" style={{ fontSize: "2.2rem" }}>
            動画を追加
          </h1>
        </div>
        <VideoForm action={createVideo} categories={categories} mode="create" />
      </main>
    </>
  );
}
