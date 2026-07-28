import Image from "next/image";

export default function AksesKotaMark({
  className = "size-5",
  priority = false,
}) {
  return (
    <Image
      src="/brand/akseskota-icon.svg?v=1"
      width={20}
      height={20}
      alt=""
      aria-hidden="true"
      draggable={false}
      priority={priority}
      unoptimized
      className={className}
    />
  );
}
