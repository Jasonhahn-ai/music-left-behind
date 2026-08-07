import Image from "next/image";
import { getGalleryImages } from "@/lib/gallery";

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-16">
      <h1 className="font-display text-3xl text-foreground">Gallery</h1>

      {images.length === 0 ? (
        <p className="text-center text-muted">No photos yet.</p>
      ) : (
        <div className="grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((src) => (
            <div
              key={src}
              className="relative aspect-square overflow-hidden rounded-xl border border-card-border shadow-[0_0_40px_-15px_var(--accent-glow),0_15px_35px_-10px_rgba(0,0,0,0.7)]"
            >
              <Image
                src={src}
                alt="Vintage band photo"
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
