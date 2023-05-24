import Head from 'next/head'

export default function HeadLayout ({
  title = 'default title',
  description = 'default-description'
}) {
  return (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta charSet='utf-8' />
        <meta name='description' content={description} />
        <meta name='theme-color' content='#F5F0F0' />
        <title>{title}</title>
        <link rel='shortcut icon' href='/images/icons/favicon.ico' />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/images/icons/apple-touch-icon.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='/images/icons/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='/images/icons/favicon-16x16.png'
        />
        <link rel='manifest' href='/site.webmanifest' />
      </Head>
    </>
  )
}
