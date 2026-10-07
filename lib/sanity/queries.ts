import groq from "groq";

export const POSTS_QUERY = groq`*[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...10]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  coverImage
}`;

export const GALLERY_QUERY = groq`*[_type == "galleryImage"] | order(_createdAt desc)[0...18]{
  _id,
  title,
  image
}`;
