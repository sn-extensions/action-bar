class HomeCtrl {
  constructor($rootScope, $scope, $timeout) {

    const permissions = [{
      name: "stream-context-item"
    }];

    const componentManager = new window.ComponentManager(permissions, function () {
      // on ready
    });
    componentManager.loggingEnabled = false;

    $scope.formData = {};
    const defaultHeight = 56;

    $scope.analyzeNote = function (note) {
      $scope.createdAt = new Date(note.created_at).toLocaleString();
      $scope.updatedAt = new Date(note.updated_at).toLocaleString();

      let text = note.content.text;
      if (!note.content.appData.prefersPlainEditor) {
        // Remove HTML tags if not in the plain editor.
        // HTML is already cleaned by the editor on save.
        const div = document.createElement("div");
        div.innerHTML = text;
        text = div.textContent || div.innerText || "";
      }
      
      $scope.wordCount = countWords(text);
      $scope.paragraphCount = text.replace(/\n$/gm, '').split(/\n/).length;
      $scope.characterCount = text.length;

      const timeToRead = $scope.wordCount / 200;
      const timeInt = Math.round(timeToRead);
      if (timeInt == 0) {
        $scope.readTime = "< 1 minute"
      } else {
        const noun = timeInt == 1 ? "minute" : "minutes";
        $scope.readTime = `${timeInt} ${noun}`;
      }

      $scope.note = note;
    }

    componentManager.streamContextItem(function (item) {
      $timeout(function () {
        $scope.analyzeNote(item);
      })
    })

    componentManager.setSize("container", "100%", defaultHeight);

    $scope.buttonPressed = function (action) {
      switch (action) {
        case "date":
          const date = new Date().toLocaleDateString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
          $scope.copyTextToClipboard(date, () => {
            $scope.copiedDate = true;
            $timeout(function () {
              $scope.copiedDate = false;
            }, 1000)
          });
          break;
        case "duplicate":
          componentManager.sendCustomEvent("duplicate-item", {
            item: $scope.note
          });
          break;
        case "copy":
          $scope.copyNoteToClipboard();
          $scope.copyText = "Copied";
          $timeout(() => {
            $scope.copyText = "Copy";
          }, 500)
          break;
        case "save":
          downloadText($scope.note.content.title, $scope.note.content.text);
          break;
        case "email":
          window.open(`mailto:?subject=${$scope.note.content.title}&body=${encodeURIComponent($scope.note.content.text)}`);
          break;
      }
    }

    $scope.copyTextToClipboard = function (text, completion) {
      const body = angular.element(document.body);
      const textarea = angular.element('<textarea/>');
      textarea.css({
        position: 'fixed',
        opacity: '0'
      });

      textarea.val(text);
      body.append(textarea);
      textarea[0].select();

      try {
        const successful = document.execCommand('copy');
        if (!successful) throw successful;
        completion && completion();
      } catch (err) {
        console.error("Failed to copy", toCopy);
      }

      textarea.remove();
    }

    $scope.copyNoteToClipboard = function () {
      $scope.copyTextToClipboard($scope.note.content.text, () => {
        $scope.copied = true;
        $timeout(function () {
          $scope.copied = false;
        }, 1000)
      });
    }

  }
}

function countWords(s) {
  // Count any word characters or ellipses:
  // https://regex101.com/r/hJ61ft/1
  return s.match(/([\w'‘’\-]|(\.{3}))+/gm).length;
}

function downloadText(filename, text) {
  const pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);

  if (document.createEvent) {
    const event = document.createEvent('MouseEvents');
    event.initEvent('click', true, true);
    pom.dispatchEvent(event);
  } else {
    pom.click();
  }
}

// required for firefox
HomeCtrl.$$ngIsClass = true;

angular.module('app').controller('HomeCtrl', HomeCtrl);
