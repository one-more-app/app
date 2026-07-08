/** @param {string} pkg @param {string[]} files */
function eslintInPackage(pkg, files) {
  const marker = `/${pkg}/`;
  const paths = files
    .map((file) => {
      const normalized = file.replace(/\\/g, "/");
      const idx = normalized.indexOf(marker);
      return idx >= 0 ? normalized.slice(idx + marker.length) : normalized;
    })
    .join(" ");
  return `cd ${pkg} && npx eslint --fix ${paths}`;
}

export default {
  "client/**/*.{ts,tsx}": (files) => eslintInPackage("client", files),
  "api/**/*.ts": (files) => eslintInPackage("api", files),
};
