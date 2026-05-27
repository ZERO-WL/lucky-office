const { switchVersion } = require('./utils');

const version = process.argv[2];

if (version == '3') {
    switchVersion(3);
} else {
    console.warn(
        `[lucky-office] expecting version "3" but got "${version}"`
    );
    process.exit(1);
}