/* eslint-disable @next/next/no-img-element */
import NewsletterForm from "./NewsletterForm";

const imgVector = "/images/figma/footer-section/asset-1.svg";
const imgSocialMediaIconSquareFacebook = "/images/figma/footer-section/asset-2.svg";
const imgSocialMediaIconSquareTwitter = "/images/figma/footer-section/asset-3.svg";
const imgSocialMediaIconSquareInstagram = "/images/figma/footer-section/asset-4.svg";
const imgGroup73 = "/images/figma/footer-section/asset-5.svg";
const imgGroup74 = "/images/figma/footer-section/asset-6.svg";

export default function FooterSection() {
  return (
    <div className="bg-[#0c6478] content-stretch flex flex-col items-center px-[64.832px] py-[74.876px] relative size-full" data-node-id="26:6511" data-name="FOOTER">
      <div className="content-stretch flex flex-col gap-[83.094px] items-start relative shrink-0" data-node-id="26:6512">
        <div className="content-stretch flex gap-[84.921px] items-start relative shrink-0" data-node-id="26:6513">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[7.305px] items-start leading-[normal] relative shrink-0" data-node-id="26:6514">
            <p className="font-sans font-bold relative shrink-0 text-[#fffdfd] text-[25.597px] whitespace-nowrap" data-node-id="26:6515">
              AksesKota
            </p>
            <p className="font-sans font-medium relative shrink-0 text-[15.466px] text-justify text-white tracking-[-0.6186px] w-[385.542px]" data-node-id="26:6516">
              AksesKota membantu pejalan kaki menemukan rute yang lebih aman, nyaman, dan ramah bagi semua melalui informasi aksesibilitas dan kondisi jalur secara aktual.
            </p>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[24.654px] items-start relative shrink-0 text-white whitespace-nowrap" data-node-id="26:6517">
            <p className="font-sans font-bold leading-[normal] relative shrink-0 text-[19.333px] tracking-[-0.7733px]" data-node-id="26:6518">
              Akses
            </p>
            <div className="font-sans font-medium grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0 text-[15.466px]" data-node-id="26:6519">
              <a href="#cara-kerja" className="col-1 leading-[normal] ml-0 mt-0 relative row-1 hover:text-[#7be3dc]" data-node-id="26:6520">{`> Cara Kerja`}</a>
              <a href="#fitur" className="col-1 leading-[normal] ml-0 mt-[19.39px] relative row-1 hover:text-[#7be3dc]" data-node-id="26:6521">{`> Fitur`}</a>
              <a href="#dampak" className="col-1 leading-[normal] ml-0 mt-[38.78px] relative row-1 hover:text-[#7be3dc]" data-node-id="26:6522">{`> Dampak`}</a>
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[24.654px] items-start relative shrink-0 text-white whitespace-nowrap" data-node-id="26:6523">
            <p className="font-sans font-bold leading-[normal] relative shrink-0 text-[19.333px] tracking-[-0.7733px]" data-node-id="26:6524">
              Support
            </p>
            <p className="font-sans font-normal leading-[27.12px] relative shrink-0 text-[16.436px]" data-node-id="26:6525">
              link.supportkaloada
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[16.436px] items-start relative shrink-0" data-node-id="26:6526">
            <p className="[word-break:break-word] font-sans font-bold leading-[27.12px] relative shrink-0 text-[25.568px] text-white whitespace-nowrap" data-node-id="26:6527">
              Subscribe to our newsletter
            </p>
            <div className="content-stretch flex flex-col gap-[23.199px] h-[215.213px] items-start relative shrink-0 w-[346.024px]" data-node-id="26:6528" data-name="24px">
              <p className="[word-break:break-word] font-sans font-medium leading-[27.12px] relative shrink-0 text-[14.61px] text-white w-[345.411px]" data-node-id="26:6529">
                Dapatkan informasi terbaru seputar aksesibilitas, pembaruan fitur, serta tips mobilitas untuk menciptakan perjalanan yang lebih aman.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-[1194.775px]" data-node-id="26:6548">
          <div className="content-stretch flex gap-[7.305px] items-center relative shrink-0" data-node-id="26:6549" data-name="Container">
            <div className="h-[21.915px] relative shrink-0 w-[17.779px]" data-node-id="26:6550" data-name="Vector">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector} />
            </div>
            <div className="relative shrink-0" data-node-id="26:6551" data-name="MonoLabel">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                <p className="[word-break:break-word] font-sans leading-[21.601px] not-italic relative shrink-0 text-[14.401px] text-white tracking-[2.1601px] uppercase whitespace-nowrap" data-node-id="26:6552">
                  © 2026 AKSESKOTA | PRIVACY POLICY | TERMS OF SERVICE
                </p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[21.266px] h-[18.419px] items-center relative shrink-0 w-[170.602px]" data-node-id="26:6553" data-name="Social Media Container">
            <div className="h-[18.419px] relative shrink-0 w-[10.602px]" data-node-id="26:6554" data-name="Social Media Icon Square/Facebook">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSocialMediaIconSquareFacebook} />
            </div>
            <div className="h-[14.541px] relative shrink-0 w-[18.313px]" data-node-id="26:6557" data-name="Social Media Icon Square/Twitter">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSocialMediaIconSquareTwitter} />
            </div>
            <div className="h-[18.419px] relative shrink-0 w-[18.313px]" data-node-id="26:6560" data-name="Social Media Icon Square/Instagram">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSocialMediaIconSquareInstagram} />
            </div>
            <div className="h-[17.45px] relative shrink-0 w-[18.313px]" data-node-id="26:6567" data-name="Social Media Icon Square/LinkedIn">
              <div className="absolute inset-[4.58%_0.79%_0.18%_4.47%]" data-node-id="26:6568">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup73} />
              </div>
            </div>
            <div className="h-[14.541px] relative shrink-0 w-[20.241px]" data-node-id="26:6571" data-name="Social Media Icon Square/YouTube">
              <div className="absolute inset-[2.65%_1.19%_4.04%_4.52%]" data-node-id="26:6572">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup74} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
