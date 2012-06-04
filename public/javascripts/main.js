
// don't copy me :) this is sloppy js

var j = $;

j(function(){
  var addItem = j('.add-item').get(0).outerHTML
    , totals = j('tr.totals').get(0);

  // toggle credit
  j('#items .toggle').click(function(){
    var el = j(this)
      , input = el.next('input');

    if ('credit' == input.val()) {
      input.val('debit');
      el.removeClass('active');
    } else {
      input.val('credit');
      el.addClass('active');
    }

    input.change();
    return false;
  });

  // edit item
  j('#items .edit-item input').change(function(){
    var self = j(this)
      , tr = self.parents('tr')
      , id = tr.data('id')
      , data = tr.find('input').serialize() + '&_method=put';

    j.post('/month/' + express.month + '/items/' + id, data, function(res){
      response(res);
      self.toggleClass('error', res.error);
    });
  });

  // add item
  j('#items-form').submit(function(){
    var data = j(this).serialize();
    j.post('/month/' + express.month + '/items', data, function(res){
      response(res);
      if (!res.error) {
        j('.add-item, tr.totals').remove();
        j('#items-form tbody').append(addItem).append(totals);
      }
    });
    return false;
  });

  // remove item
  j('#items .delete').live('click', function(){
    var self = j(this);
    Dialog.confirm('Delete this item?', function(ok){
      if (ok) {
        var url = self.attr('href');
        remove(self.parents('tr'));
        j.post(url, { _method: 'DELETE' }, function(res){
          response(res);
        });
      }
    });
    return false;
  });

  // display config
  j('#menu .config a').click(function(){
    new Dialog('#config').show();
    return false;
  });

  // display charts
  j('#menu .charts a').click(function(){
    $.get('/month/' + express.month + '/items', function(items){
      var dialog = new Dialog('#chart');
      dialog.show();
      categoryChart(items, dialog.el.find('.chart').get(0), 750, 400);
      dialog.resize();
    });
    return false;
  });

  // sort columns
  j('table thead th').click(function(){
    var i = this.cellIndex
      , self = j(this)
      , table = self.parents('table')
      , tbody = table.find('tbody')
      , rows = table.find('tbody tr')
      , items = rows.slice(0, -2)
      , tail = rows.slice(-2)
      , direction = self.hasClass('asc')
        ? 'desc'
        : 'asc'
      , numeric = self.hasClass('numeric');

    table
      .find('th')
      .removeClass('asc')
      .removeClass('desc');

    self
      .removeClass('asc')
      .removeClass('desc')
      .addClass(direction);

    function sortNumeric(a, b){
      var a = parseInt(j(a.cells[i]).find('input').val(), 10)
        , b = parseInt(j(b.cells[i]).find('input').val(), 10);

      return  'asc' == direction
      ? a - b
      : b - a;                
    }

    function sortString(a,b){
      var a = j(a.cells[i]).find('input').val().toString();
      var b = j(b.cells[i]).find('input').val().toString();

      var agb = a > b ? 1 : -1;

      return 'asc' == direction
      ? agb
      : -agb;      
    }

    items.sort( numeric 
      ? sortNumeric 
      : sortString
    ).each(function(i, row){
      tbody.append(row);
    });

    tail.each(function(i, row){
      tbody.append(row);
    });
  });
  
  j(document).keyup(function(e){
    if (!e.ctrlKey) return;
    switch (e.keyCode) {
      case 37 : // Left
        window.location = j("#prev-month").attr("href");
        break;
      case 39 : // Right
        window.location = j("#next-month").attr("href");
        break;
     }
  });
});

/**
 * Notify `msg` for the given `duration` defaulting to 2 seconds.
 *
 * @param {String} type
 * @param {String} msg
 * @param {Number} duration
 */

function notify(type, msg, duration) {
  if (!msg) msg = type, type = 'info';
  duration = duration || 2000;
  var el = j('<li class="' + type + '">' + msg + '</li>');
  j('#notifications').append(el);
  setTimeout(function(){ remove(el); }, duration);
}

/**
 * Fade out then remove `el`.
 *
 * @param {jQuery} el
 */

function remove(el) {
  j(el).fadeOut(function(){
    j(el).remove();
  });
}

/**
 * Handle `res`.
 *
 * @param {Object} res
 */

function response(res) {
  if (res.error) {
    notify('error', res.error);
  } else {
    if (res.message) notify(res.message);
    if (res.prepend) j(res.to).prepend(res.prepend);
    if (res.append) j(res.to).append(res.append);
  }
}

/**
 * Generate category chart.
 */

function categoryChart(items, container, width, height) {
  var radius = height * 0.40
    , r = Raphael(container, width, height)
    , category = data(items, 'category');

  var pie = r.g.piechart(
      width / 2
    , height / 2
    , radius
    , category.data, { legend: category.names });

  hover(pie);
}

/**
 * Handle pie segment hover.
 */

function hover(pie) {
  pie.hover(function(){
    this.sector.stop();
    this.sector.scale(1.1, 1.1, this.cx, this.cy);
    if (this.label) {
      this.label[0].stop();
      this.label[0].scale(1.5);
      this.label[1].attr({ 'font-weight': 800 });
    }
  }, function(){
    this.sector.animate({ scale: [1, 1, this.cx, this.cy] }, 500, 'bounce');
    if (this.label) {
      this.label[0].animate({ scale: 1 });
      this.label[1].attr({ 'font-weight': 400 });
    }
  });
}

/**
 * Data mapper.
 */

function data(items, prop) {
  var obj = { names: [], data: [] }
    , sums = {};

  Object.keys(items).forEach(function(id){
    var item = items[id];
    sums[item[prop]] = sums[item[prop]] || { count: 0, amount: 0 };
    sums[item[prop]].count++;
    sums[item[prop]].amount += item.amount;
  });

  Object.keys(sums).forEach(function(name){
    var count = sums[name].count
      , amount = sums[name].amount;

    obj.names.push('$' + amount + ' - ' + name + ' (' + count + ')');
    obj.data.push(amount);
  });

  return obj;
}

