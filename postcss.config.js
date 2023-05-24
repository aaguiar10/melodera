// https://nextjs.org/docs/pages/building-your-application/configuring/post-css
module.exports = {
  plugins: [
    'postcss-flexbugs-fixes',
    [
      'postcss-preset-env',
      {
        autoprefixer: {
          flexbox: 'no-2009'
        },
        stage: 3,
        features: {
          'custom-properties': false
        }
      }
    ],
    [
      '@fullhuman/postcss-purgecss',
      {
        content: [
          './pages/**/*.{js,jsx,ts,tsx}',
          './components/**/*.{js,jsx,ts,tsx}'
        ],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        safelist: {
          standard: ['html', 'body', 'sticky-top'],
          deep: [
            /^navbar/,
            /^nav/,
            /^collapse/,
            /^dropdown/,
            /^container/,
            /^btn/,
            /^toast/
          ]
        }
      }
    ]
  ]
}
