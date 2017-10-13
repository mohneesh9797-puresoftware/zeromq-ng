{
  'variables': {
    'zmq_shared%': 'false',
  },

  'targets': [
    {
      'target_name': 'zeromq',
      'sources': [
        'src/binding.cc',
        'src/context.cc',
        'src/observer.cc',
        'src/proxy.cc',
        'src/socket.cc',
      ],

      'include_dirs': [
        "<!@(node -p \"require('node-addon-api').include\")",
        '<(PRODUCT_DIR)/../../libzmq/include',
      ],

      'defines': [
        'NAPI_DISABLE_CPP_EXCEPTIONS',
        'ZMQ_STATIC',
      ],

      'conditions': [
        ["zmq_shared == 'true'", {
          'link_settings': {
            'libraries': ['-lzmq'],
          },
        }, {
          'conditions': [
            ['OS != "win"', {
              'libraries': [
                '<(PRODUCT_DIR)/../../libzmq/lib/libzmq.a',
              ],
            }],

            ['OS == "win"', {
              'msbuild_toolset': 'v140',
              'libraries': [
                '<(PRODUCT_DIR)/../../libzmq/lib/libzmq',
                'ws2_32.lib',
                'iphlpapi',
              ],
            }],
          ],
        }],
      ],
    }
  ],

  'target_defaults': {

    'configurations': {
      'Debug': {
        'conditions': [
          ['OS == "linux" or OS == "freebsd" or OS == "openbsd" or OS == "solaris"', {
            'cflags_cc!': [
              '-std=gnu++0x'
            ],
            'cflags_cc+': [
              '-std=c++11',
              '-Wno-missing-field-initializers',
            ],
          }],

          ['OS == "mac"', {
            'xcode_settings': {
              # https://pewpewthespells.com/blog/buildsettings.html
              'CLANG_CXX_LIBRARY': 'libc++',
              'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
              'MACOSX_DEPLOYMENT_TARGET': '10.9',
              'WARNING_CFLAGS': [
                '-Wextra',
                '-Wno-unused-parameter',
                '-Wno-missing-field-initializers',
              ],
            },
          }],

          ['OS == "win"', {
            'msvs_settings': {},
          }],
        ],
      },

      'Release': {
        'conditions': [
          ['OS == "linux" or OS == "freebsd" or OS == "openbsd" or OS == "solaris"', {
            'cflags_cc!': [
              '-std=gnu++0x'
            ],
            'cflags_cc+': [
              '-std=c++11',
              '-flto',
              '-Wno-missing-field-initializers',
            ],
          }],

          ['OS == "mac"', {
            # https://pewpewthespells.com/blog/buildsettings.html
            'xcode_settings': {
              'CLANG_CXX_LIBRARY': 'libc++',
              'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
              'MACOSX_DEPLOYMENT_TARGET': '10.9',
              'LLVM_LTO': 'YES',
              'GCC_OPTIMIZATION_LEVEL': '3',
            },
          }],

          ['OS == "win"', {
            'msvs_settings': {
              'VCLinkerTool': {
                'AdditionalOptions': ['/ignore:4099'],
              },
            },
          }],
        ],
      },
    },
  },
}
