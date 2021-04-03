const path = require("path");

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
