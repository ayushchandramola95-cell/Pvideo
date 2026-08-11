export interface InfoPageContent {
  title: string;
  subtitle: string;
  content: string;
  sections?: { heading: string; body: string }[];
}

export const INFO_PAGES: Record<string, InfoPageContent> = {
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Everything you need to know about streaming and downloading on Pornora.',
    content: 'Find quick answers to common questions about our platform, video playback, content updates, and features.',
    sections: [
      {
        heading: 'What is Pornora?',
        body: 'Pornora is a premium adult video indexing search engine and self-hosted streaming portal. We aggregate the finest adult content from across the web, categorize it meticulously by performer and niche, and host releases in high-definition to deliver a safe, fast, and pleasurable viewing experience.',
      },
      {
        heading: 'Is Pornora completely free?',
        body: 'Yes, Pornora is 100% free. We do not require any paid subscriptions, memberships, or account registration to watch or download our premium adult video collection.',
      },
      {
        heading: 'Can I download adult videos from Pornora?',
        body: 'Yes! For all premium hosted video releases, a download button is available directly in the player action row. You can download the MP4 file for offline viewing. Third-party external releases are hosted on partner sites and may have different options.',
      },
      {
        heading: 'How often is the performer directory updated?',
        body: 'Our performer index and pornstar pages are updated daily. Whenever new video releases featuring a particular performer are published, they are automatically linked to their performer page.',
      },
      {
        heading: 'I found an issue with a video. How can I report it?',
        body: 'If you encounter a broken video, incorrect thumbnail, or a content violation, please use our Contact page or submit a removal request under our Notice and Action policy. Our moderation team reviews reports within 24 hours.',
      },
    ],
  },
  advertise: {
    title: 'Advertise & Get Listed',
    subtitle: 'Promote your adult brand to millions of engaged daily viewers.',
    content: 'Maximize your reach and drive high-quality traffic to your website or platform with Pornora advertising solutions.',
    sections: [
      {
        heading: 'Why Advertise with Pornora?',
        body: 'Pornora is one of the fastest-growing adult video portals on the web, hosting over 62,000 indexed premium releases. Our users are highly engaged and actively searching for high-quality adult entertainment, making our platform the perfect place to promote cameras, games, dating sites, or tubes.',
      },
      {
        heading: 'Available Ad Formats',
        body: 'We support standard IAB display banners (300x250, 728x90, 160x600), native video ads, popunder traffic, and premium category sponsor links. We also offer direct integration on our watches pages.',
      },
      {
        heading: 'Traffic & Demographics',
        body: 'Our traffic is global, with strong concentrations in North America, Western Europe, and East Asia. Detailed geos and referrer data are available upon request to our sales desk.',
      },
      {
        heading: 'Contact Our Sales Team',
        body: 'To receive our latest media kit and traffic statistics, or to set up a campaign, please email ads@pornora.site. Minimum budget requirements apply for direct buys.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Please read our terms of use carefully before browsing Pornora.',
    content: 'These Terms of Service govern your access to and use of Pornora.site. By using the site, you agree to comply with these terms.',
    sections: [
      {
        heading: '1. Age Requirements',
        body: 'You must be at least 18 years of age (or the legal age of majority in your jurisdiction, whichever is older) to access or view any content on Pornora. If you are under 18, you are not authorized to use this website and must exit immediately.',
      },
      {
        heading: '2. Acceptable Use',
        body: 'Pornora is provided solely for personal, non-commercial entertainment. You agree not to scrape, copy, redistribute, or exploit any content on this site for commercial purposes. Any automated access (crawlers, bots) not explicitly authorized is prohibited.',
      },
      {
        heading: '3. Disclaimer of Warranties',
        body: 'Pornora is provided on an "as-is" and "as-available" basis. We make no representations or warranties of any kind, express or implied, regarding the accuracy, availability, security, or suitability of the content or video streams.',
      },
      {
        heading: '4. Limitation of Liability',
        body: 'Under no circumstances shall Pornora or its operators be liable for any direct, indirect, incidental, or consequential damages resulting from your use of, or inability to use, the platform or third-party links.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we handle data and protect your privacy on Pornora.site.',
    content: 'Your privacy is paramount. This policy outlines what data we collect, how it is used, and your privacy rights.',
    sections: [
      {
        heading: '1. Data We Collect',
        body: 'Pornora operates as an anonymous platform. We do not require registration, and we do not collect personal information such as names, email addresses, or phone numbers from general viewers. We collect anonymous usage statistics (views, search queries, browser types) to optimize performance and server loads.',
      },
      {
        heading: '2. Cookies and Tracking',
        body: 'We use cookies to maintain your site preferences (such as dark mode or search filters) and to analyze traffic via anonymous analytics. You can disable cookies in your browser settings without affecting video playback.',
      },
      {
        heading: '3. Data Security',
        body: 'We implement industry-standard security protocols to protect all server interactions. Since we do not store user database profiles or billing info, your personal risk is virtually zero.',
      },
      {
        heading: '4. GDPR & CCPA Compliance',
        body: 'EU and California residents have the right to request deletion of any anonymous identifiers or logs. Please contact privacy@pornora.site if you wish to submit a data query.',
      },
    ],
  },
  responsibility: {
    title: 'Statement of Responsibility',
    subtitle: 'Our absolute commitment to legal compliance and child safety.',
    content: 'Pornora maintains a zero-tolerance policy for any illegal or non-consensual content.',
    sections: [
      {
        heading: 'Content Monitoring & Moderation',
        body: 'We strictly review all content indexed on our platform. Any upload that does not meet our rigorous standards for performer age verification and explicit consent is blocked or deleted immediately.',
      },
      {
        heading: 'Zero-Tolerance for Illegal Content',
        body: 'We strictly prohibit and actively monitor against any form of non-consensual sexual content, underage content, or violence. Any suspected violations are immediately reported to the appropriate law enforcement authorities and child protection agencies (including NCMEC).',
      },
      {
        heading: 'Reporting Violations',
        body: 'If you believe any content on Pornora violates local or international laws, please contact our emergency safety compliance officer at safety@pornora.site.',
      },
    ],
  },
  'notice-action': {
    title: 'Notice & Action Policy',
    subtitle: 'Procedure for reporting and removing illegal or infringing content.',
    content: 'Pornora provides a straightforward mechanism for rights holders and individuals to request content removals.',
    sections: [
      {
        heading: 'How to Submit a Removal Request',
        body: 'To request removal of any video release from Pornora, please email compliance@pornora.site with the specific URLs of the content, a detailed explanation of the violation, and proof of your identity or rights representation.',
      },
      {
        heading: 'Supported Grounds for Removal',
        body: 'We accept removal requests for: copyright infringement (DMCA), privacy violations (non-consensual depictions), trademark infringement, or illegal material.',
      },
      {
        heading: 'Response Timelines',
        body: 'Our compliance department operates 24/7. Valid notice requests are acted upon and content is disabled within 12 to 24 hours of receipt.',
      },
    ],
  },
  dmca: {
    title: 'DMCA & Copyright Compliance',
    subtitle: 'Digital Millennium Copyright Act take-down notifications.',
    content: 'Pornora respects intellectual property rights. We respond promptly to allegations of copyright infringement in accordance with the DMCA.',
    sections: [
      {
        heading: 'Filing a DMCA Notice',
        body: 'If you are a copyright owner and believe that content hosted on Pornora infringes your copyright, you may submit a notification under the DMCA by providing our Designated Copyright Agent with: a physical/electronic signature, identification of the infringed work, identification of the infringing URL, and your contact details. Send notices to dmca@pornora.site.',
      },
      {
        heading: 'Counter-Notification',
        body: 'If you believe your content was removed by mistake or misidentification, you may file a counter-notice containing: your signature, identification of the removed URL, a statement under penalty of perjury that you have a good faith belief the removal was an error, and your consent to federal court jurisdiction.',
      },
      {
        heading: 'Repeat Infringers',
        body: 'It is our policy to block and terminate access for any upload source or partner account that repeatedly violates copyright terms.',
      },
    ],
  },
  'acceptable-content': {
    title: 'Acceptable Content Policy',
    subtitle: 'Guidelines outlining permitted and prohibited material on Pornora.',
    content: 'All video releases indexed on Pornora must adhere strictly to these content guidelines.',
    sections: [
      {
        heading: 'Permitted Material',
        body: 'We permit adult entertainment content depicting consenting adults aged 18 or older. This includes professional adult studio releases, independent amateur content, and performer-uploaded clips.',
      },
      {
        heading: 'Prohibited Material',
        body: 'We strictly prohibit: any depictions of individuals under the age of 18; non-consensual content (revenge porn); extreme violence, torture, or physical abuse; content involving non-human species; and any form of illegal act.',
      },
      {
        heading: 'Compliance Checks',
        body: 'Our ingestion queue programmatically filters metadata for restricted keywords. Content that fails these automated checks is permanently flagged and deleted.',
      },
    ],
  },
  dsa: {
    title: 'Digital Services Act (DSA)',
    subtitle: 'EU Digital Services Act compliance and reporting dashboard.',
    content: 'In compliance with the European Union Digital Services Act (Regulation EU 2022/2065), Pornora provides the following points of contact and information.',
    sections: [
      {
        heading: 'Designated Point of Contact',
        body: 'For EU authorities and users, our designated point of contact under the DSA is dsa@pornora.site. Communication can be sent in English or German.',
      },
      {
        heading: 'Reporting Mechanism',
        body: 'EU users can submit reports regarding illegal content directly to dsa-compliance@pornora.site. Please include detailed descriptions and URLs.',
      },
      {
        heading: 'User Redress & Complaints',
        body: 'If you disagree with a moderation decision regarding content removal, you have the right to appeal our decision within 6 months. Detailed instructions will be provided in our moderation notification email.',
      },
    ],
  },
  '2257': {
    title: 'U.S.C. § 2257 Compliance Statement',
    subtitle: 'Federal recordkeeping compliance certification.',
    content: 'Pornora.site complies with the recordkeeping requirements of Title 18, United States Code, Section 2257.',
    sections: [
      {
        heading: 'Compliance Declaration',
        body: 'Pornora is not a producer (primary or secondary) of any of the visual depictions of sexually explicit conduct contained on this website. With respect to all visual depictions on this website, Pornora complies with all recordkeeping requirements of 18 U.S.C. Section 2257 and its implementing regulations by: (a) indexing only content produced by studios/publishers who certify compliance, or (b) retrieving certification of age and records custody from the primary producer.',
      },
      {
        heading: 'Custodian of Records',
        body: 'All records required to be maintained under 18 U.S.C. § 2257 are kept by the respective primary producers/studios. Custodian and address information for any specific release can be requested via compliance@pornora.site.',
      },
      {
        heading: 'Age Verification',
        body: 'All performers depicted in sexually explicit conduct on this website were 18 years of age or older at the time of production.',
      },
    ],
  },
};
