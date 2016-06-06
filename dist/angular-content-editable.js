angular.module('angular-content-editable', [])

.directive('contentEditable', function ($log,$sce,$compile,$window) {

  var directive = {
    restrict: 'A',
    require: '?ngModel',
    scope: { editCallback: '=', ngModel: '=' },
    link: _link
  }

  return directive;

  function _link(scope, elem, attrs, ngModel) {

    // return if ng model not specified
    if(!ngModel) {
      $log.warn('Error: ngModel is required in elem: ', elem);
      return;
    }

    var noEscape = true;

    var editableClass = attrs.editableClass || 'content-editable';

    // if model is invalid or null
    // fill his value with elem html content
    if( !scope.ngModel ) {
      ngModel.$setViewValue( elem.html() );
    }

    // add default class
    elem.addClass(editableClass);

    // render always with model value
    ngModel.$render = function() {
      elem.html( ngModel.$modelValue )
    }

    /**
     * On click turn the element
     * to editable and focus it
     */
    elem.bind('click', function(e) {
      e.preventDefault();
      elem.attr('contenteditable', 'true');
      return elem[0].focus();
    })

    /**
     * On element focus
     */
    elem.bind('focus', function(e) {

      noEscape = true;

      // select all on focus
      if( attrs.focusSelect ) {
        var range = $window.document.createRange()
        range.selectNodeContents(elem[0])
        $window.getSelection().addRange(range)
      }

      // if render-html is enabled convert
      // all text content to plaintext
      // in order to modify html tags
      if( attrs.renderHtml ) {
        elem[0].textContent = elem.html();
      }

    })

    /**
     * On element blur turn off
     * editable mode, if HTML, render
     * update model value and run callback
     * if specified
     */
    elem.bind('blur', function() {

      var html;

      elem.attr('contenteditable', 'false')

      // if text needs to be rendered as html
      if( attrs.renderHtml && noEscape ) {

        // get plain text html (with html tags)
        // replace all blank spaces
        html = elem[0].textContent.replace(/\u00a0/g, " ")
        // update elem html value
        elem.html(html)

      } else {

        // get element content replacing html tag
        html = elem.html().replace(/<div>/g, '').replace(/&nbsp;/g, ' ').replace(/<\/div>/g, '');
      }

      // if element value is
      // different from model value
      if( html != ngModel.$modelValue ) {

        /**
         * This method should be called
         * when a controller wants to
         * change the view value
         */
        ngModel.$setViewValue(html)

        // if user passed a valid callback
        if( scope.editCallback && angular.isFunction(scope.editCallback) ) {
          // apply the callback
          // with arguments: current text and element
          return scope.$apply( scope.editCallback(html, elem) );
        }

      }

    })

    // bind esc and enter keys
    elem.bind('keydown', function(e) {

      // on tab key blur and
      // TODO: focus to next
      if( e.which == 9 ) {
        elem[0].blur();
        console.log( elem.next() );
        elem.next().triggerHandler('focus');
        return;
      }

      // on esc key roll back value and blur
      if( e.which == 27 ) {
        ngModel.$rollbackViewValue();
        noEscape = false;
        return elem[0].blur();
      }

      // if single line or ctrl key is
      // pressed trigger the blur event
      if( e.which == 13 && (attrs.singleLine || e.ctrlKey) ) {
        return elem[0].blur();
      }

    })

  }

})