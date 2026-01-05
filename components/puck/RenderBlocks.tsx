"use client";

import type { PuckBlock, PuckDataShape } from "@/lib/puck/types";

import BookingCTABlock from "@/components/puck/blocks/BookingCTA";
import FeaturesBlock from "@/components/puck/blocks/Features";
import FooterBlock from "@/components/puck/blocks/Footer";
import GalleryBlock from "@/components/puck/blocks/Gallery";
import HeroBlock from "@/components/puck/blocks/Hero";
import RichTextBlock from "@/components/puck/blocks/RichText";

const blockMap: Record<PuckBlock["type"], (props: any) => JSX.Element> = {
  Hero: (props) => <HeroBlock {...props} />,
  RichText: (props) => <RichTextBlock {...props} />,
  Features: (props) => <FeaturesBlock {...props} />,
  Gallery: (props) => <GalleryBlock {...props} />,
  BookingCTA: (props) => <BookingCTABlock {...props} />,
  Footer: (props) => <FooterBlock {...props} />,
};

export default function RenderBlocks({ data }: { data: PuckDataShape }) {
  return (
    <div>
      {data.content.map((block, index) => {
        const Block = blockMap[block.type];
        if (!Block) {
          return null;
        }
        return <div key={`${block.type}-${index}`}>{Block(block.props)}</div>;
      })}
    </div>
  );
}
