const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",

  entry: "./src/index.ts",

  module: {
    rules: [
      {
        // 拡張子 .ts の場合
        test: /\.ts$/,
        // TypeScript をコンパイルする
        use: "ts-loader",
      },
    ],
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "src/index.html",
          to: "./index.html",
        },
        {
          from: "src/css/style.css",
          to: "./css/style.css",
        },
        {
          from: "src/img/favicon.svg",
          to: "./favicon.svg",
        },
        {
          from: "src/img/ogp.png",
          to: "./img/ogp.png",
        },
      ],
    }),
  ],

  devServer: {
    contentBase: path.resolve(__dirname, "dist"),
    open: true, //起動時にブラウザを開く
    overlay: true, //エラーをオーバーレイ表示
  },
  resolve: {
    // 拡張子を配列で指定
    extensions: [".ts", ".js"],
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/main.js",
  },
};
