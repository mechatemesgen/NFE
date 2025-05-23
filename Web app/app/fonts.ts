import localFont from 'next/font/local';

export const inter = localFont({
  src: [
    {
      path: './public/fonts/inter/Inter-Regular.woff2',
      weight: '400',
    },
    {
      path: './public/fonts/inter/Inter-Bold.woff2',
      weight: '700',
    },
  ],
  variable: '--font-inter',
});
