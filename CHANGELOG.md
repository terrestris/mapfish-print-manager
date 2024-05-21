## [12.1.1](https://github.com/terrestris/mapfish-print-manager/compare/v12.1.0...v12.1.1) (2024-05-21)


### Bug Fixes

* fixes XYZ layer so it prints and simplifies OSM serialzer ([b4bd005](https://github.com/terrestris/mapfish-print-manager/commit/b4bd005645dd52149a420df866649a40c94ce6c0))

# [12.1.0](https://github.com/terrestris/mapfish-print-manager/compare/v12.0.0...v12.1.0) (2024-05-03)


### Bug Fixes

* fixes failed checks ([4bd0d3c](https://github.com/terrestris/mapfish-print-manager/commit/4bd0d3c9d53470d294507319f2210e4c16a2d4a3))
* fixes url for XYZ and updates Stamen file to StadiaMaps ([83c1cb4](https://github.com/terrestris/mapfish-print-manager/commit/83c1cb4080895eb0c35207f2e6116255a1bcc31e))
* respects Dependency Inversion principle by extending XYZ with OSM ([bb9a6cb](https://github.com/terrestris/mapfish-print-manager/commit/bb9a6cb71f831a645d52eff4b1b1fa7c27cda377))


### Features

* adds a XYZ Serializer ([f3a5b26](https://github.com/terrestris/mapfish-print-manager/commit/f3a5b26e6474927343396f140dd06140f80e1173))

# [12.0.0](https://github.com/terrestris/mapfish-print-manager/compare/v11.0.3...v12.0.0) (2024-04-04)


### chore

* uses ol v9.1.0 and adjusts a version mismatch ([9155780](https://github.com/terrestris/mapfish-print-manager/commit/915578068138f55ecbe29603ee3530c22ab9553c))


### BREAKING CHANGES

* Uses ol9 now

## [11.0.3](https://github.com/terrestris/mapfish-print-manager/compare/v11.0.2...v11.0.3) (2024-04-03)


### Bug Fixes

* adjust serializer for ol9 update ([96d0406](https://github.com/terrestris/mapfish-print-manager/commit/96d040664cac14ff37e09cd5f58d2e1a21186b18))
* adjustments to match existing code ([f97b0cd](https://github.com/terrestris/mapfish-print-manager/commit/f97b0cdfae3bbb971e055ac02058034e5c825b4b))
* update query-string and adjust dev settings ([5f72b81](https://github.com/terrestris/mapfish-print-manager/commit/5f72b81af747df18b196c3ad02b863cebb952afd))

## [11.0.2](https://github.com/terrestris/mapfish-print-manager/compare/v11.0.1...v11.0.2) (2024-02-23)


### Bug Fixes

* dimension serialization for WMTS layers for Mapfish v3 ([f430695](https://github.com/terrestris/mapfish-print-manager/commit/f430695ab15d3b5abf1cb1d6317fd0c39b0b1990))

## [11.0.1](https://github.com/terrestris/mapfish-print-manager/compare/v11.0.0...v11.0.1) (2024-02-23)


### Bug Fixes

* webpack configs for v5 and bump css and style loader ([b8f68ed](https://github.com/terrestris/mapfish-print-manager/commit/b8f68edbb12b72e14ad04ca99b03186fe88fbd6a))

# [11.0.0](https://github.com/terrestris/mapfish-print-manager/compare/v10.1.0...v11.0.0) (2024-02-22)


### Bug Fixes

* adds missing build script and remove np dependency ([64c929d](https://github.com/terrestris/mapfish-print-manager/commit/64c929da8045c4d0761bed1fdcc4e4448c93d2fd))
* disable husky for npx release ([7d3c850](https://github.com/terrestris/mapfish-print-manager/commit/7d3c850708581bfa270d0643ec8fd2ec6dadaa6c))
* docs folder ([c51cfe9](https://github.com/terrestris/mapfish-print-manager/commit/c51cfe9f91b6612a3eee6e52826ac2276f3a722e))
* remove duplicate docs build ([8a6e174](https://github.com/terrestris/mapfish-print-manager/commit/8a6e17443c3a0d407106fd0d84b805608e1fff8b))


### chore

* introduce semantic release and commitlint configuration ([1997c5f](https://github.com/terrestris/mapfish-print-manager/commit/1997c5f45af0579e83ee11ec6c38bc438912efce))


### Features

* introduce dependabot config ([5283f20](https://github.com/terrestris/mapfish-print-manager/commit/5283f209774017c19105b32c42aba4e1e906d399))
* introduce semantic release action on main branch ([de2aeb3](https://github.com/terrestris/mapfish-print-manager/commit/de2aeb38faf21e278252282c31a2f9bcaf8de241))


### BREAKING CHANGES

* Introduce Semantic release and commitlint and require
Node 18
