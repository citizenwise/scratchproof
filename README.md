# ScratchProof site

Served at https://citizenwise.app/scratchproof/ (GitHub project Pages under the citizenwise org). Source of truth: rental-proof/web/scratchproof. Test: node test.mjs

Verify page: https://citizenwise.app/scratchproof/verify is verify.html (GitHub Pages serves /verify from verify.html). verify-lib.js is GENERATED from the app's seal package, never edited here: in the app repo run `npm run verify-web -- --out ../web/scratchproof/verify-lib.js` (the app keeps a committed copy in tools/verify-web/dist that local-ci checks). test-fixtures/ are byte copies of the app's packages/services/seal/tests/fixtures/proof-*.
