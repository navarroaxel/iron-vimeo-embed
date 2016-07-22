angular.module('ironVimeoEmbed', []).factory('ironVimeoService', ['$http', function ($http) {
    'use strict';
    return {
        /**
         * Returns a summary object about the Vimeo video
         * @param videoId the video id in Vimeo
         * @returns {*}
         */
        getVideo: function (videoId) {
            // A simple api call to load the video summary.
            return $http.get('https://vimeo.com/api/v2/video/' + videoId + '.json').then(function (response) {
                return response.data[0];
            });
        }
    };
}]).directive('ironVimeoEmbed', ['$sce', '$window', function ($sce, $window) {
    'use strict';
    return {
        restrict: 'E',
        template: '<iframe ng-src="{{$ctrl.videoUrl}}" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>',
        scope: {},
        bindToController: {
            videoId: '=',
            player: '=?',
            onReady: '&',
            onPlay: '&',
            onPause: '&',
            onFinish: '&',
            onPlayProgress: '&',
            onSeek: '&'
        },
        controllerAs: '$ctrl',
        controller: ['$element', '$attrs', '$rootScope', function ($element, $attrs, $rootScope) {
            var $ctrl = this;
            // Set video URL as iframe src.
            $ctrl.videoUrl = $sce.trustAsResourceUrl('https://player.vimeo.com/video/' + $ctrl.videoId + '?api=1');

            // Exposed API
            $ctrl.player = {
                play: function () {
                    post('play');
                },
                pause: function () {
                    post('pause');
                },
                unload: function () {
                    post('unload');
                },
                seekTo: function (seconds) {
                    post('seekTo', seconds);
                }
            };

            // Listen for messages from the player
            if ($window.addEventListener) {
                $window.addEventListener('message', onMessageReceived, false);
            }
            else {
                $window.attachEvent('onmessage', onMessageReceived, false);
            }

            var playerOrigin = '*';

            // Handle messages received from the player
            function onMessageReceived(event) {
                // Handle messages from the vimeo player only
                if (!(/^https?:\/\/player.vimeo.com/).test(event.origin)) {
                    return false;
                }

                if (playerOrigin === '*') {
                    playerOrigin = event.origin;
                }

                var data = angular.fromJson(event.data);
                if (data.event == 'ready') {
                    // Register event listeners for next events
                    post('addEventListener', 'play');
                    post('addEventListener', 'pause');
                    post('addEventListener', 'finish');
                    post('addEventListener', 'playProgress');
                    post('addEventListener', 'seek');
                }
                $rootScope.$apply(function () {
                    // converts 'ready' event name to onReady handler name.
                    $ctrl['on' + data.event.substr(0, 1).toUpperCase() + data.event.substr(1)]({data: data.data});
                });
            }

            // Helper function for sending a message to the player
            function post(action, value) {
                var data = {method: action};
                if (value) {
                    data.value = value;
                }

                var message = angular.toJson(data);
                $element.find('iframe')[0].contentWindow.postMessage(message, playerOrigin);
            }
        }]
    };
}]);
