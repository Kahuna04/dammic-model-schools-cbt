import Image from "next/image";
import Section from "@/components/Section";
import { client } from "@/lib/sanity/client";
import { GALLERY_QUERY } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { Suspense } from "react";
import { GalleryGridSkeleton } from "@/components/SkeletonLoader";

async function GalleryImages() {
  let items: any[] = [];
  try {
    items = await client.fetch(GALLERY_QUERY);
  } catch (e) {
    items = [];
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.length ? (
          items.map((img) => (
            <Image
              key={img._id}
              src={urlFor(img.image).width(800).height(600).url()}
              alt={img.title || "School"}
              width={800}
              height={600}
              className="rounded-lg object-cover w-full h-48"
            />
          ))
        ) : (
          Array.from({ length: 9 }).map((_, i) => (
            <Image
              key={i}
              src={`https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800&h=600&auto=format&q=60&sig=${i}`}
              alt="School"
              width={800}
              height={600}
              className="rounded-lg object-cover w-full h-48"
            />
          ))
        )}
      </div>
      {!items.length && (
        <p className="text-xs text-gray-600 mt-4">No gallery images yet — showing placeholders. Add images in the CMS.</p>
      )}
    </>
  );
}

export default function Page() {
  return (
    <div className="space-y-6">
      <Section title="Gallery" intro="Snapshots of learning and life at Dammic.">
        <Suspense fallback={<GalleryGridSkeleton />}>
          <GalleryImages />
        </Suspense>
      </Section>
    </div>
  );
}
