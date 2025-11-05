import Image from "next/image";
import { client } from "@/lib/sanity/client";
import { groq } from "next-sanity";
import PortableText from "@/components/PortableText";
import { urlFor } from "@/lib/sanity/image";
import Link from "next/link";

const POST_QUERY = groq`*[_type == "post" && slug.current == $slug][0]{
  title,
  excerpt,
  publishedAt,
  coverImage,
  body
}`;

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let post: any = null;
  try {
    post = await client.fetch(POST_QUERY, { slug });
  } catch (e) {}

  if (!post) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-semibold text-brand-dark">Post not found</h2>
        <p className="mt-2 text-gray-700">Return to <Link href="/news" className="underline">News</Link>.</p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-brand-dark">{post.title}</h1>
      <p className="text-xs text-gray-500 mt-1">{post.publishedAt?.slice(0, 10)}</p>
      {post.coverImage && (
        <Image
          src={urlFor(post.coverImage).width(1200).height(700).url()}
          alt={post.title}
          width={1200}
          height={700}
          className="rounded-lg mt-4"
        />
      )}
      <div className="mt-6">
        <PortableText value={post.body} />
      </div>
    </article>
  );
}
