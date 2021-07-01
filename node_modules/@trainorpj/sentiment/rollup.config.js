import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    input: "lib/index.js",
    output: {
        file: "bundle/bundle.js",
        format: "umd",
        name: "sentiment"
    },
    plugins: [
        nodeResolve(),
        json(),
        commonjs()
    ]
}