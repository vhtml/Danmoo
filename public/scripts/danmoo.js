(function(exports) {

	var _RAF = requestAnimationFrame;
	var _CAF = cancelAnimationFrame;
	var doc = exports.document;

	var _rnd = function(m, n) {
		return Math.floor(m + Math.random() * (n - m));
	};
	var _shuffleFn = function() {
		return Math.random() - 0.5;
	};
	var _extend = function(o, o1) {
		if (typeof o1 === 'object') {
			for (var i in o) {
				o[i] = o1[i] || o[i];
			}
			return o;
		}
		return o;
	};
	var _optimize = function(dm) {
		doc.addEventListener('visibilitychange', function() {
			if (document.hidden) {
				dm.suspend();
			} else {
				dm.start();
			}
		});
	};

	var COLORS = [
		'#333', '#e21400', '#333', '#91580f', '#333', '#f8a700', '#333', '#f78b00',
		'#333', '#58dc00', '#333', '#287b00', '#333', '#a8f07a', '#333', '#4ae8c4',
		'#333', '#3b88eb', '#333', '#3824aa', '#333', '#a700ff', '#333', '#d300e7'
	];
	var SHADOW_COLORS = [
		'#fff', '#e21400', '#fff', '#91580f', '#fff', '#f8a700', '#fff', '#f78b00',
		'#fff', '#58dc00', '#fff', '#287b00', '#fff', '#a8f07a', '#fff', '#4ae8c4',
		'#fff', '#3b88eb', '#fff', '#3824aa', '#fff', '#a700ff', '#fff', '#d300e7'
	];
	var FONT_FAMILY = [
		'Arial', 'Helvetica', 'Helvetica Neue', 'STHeiTi', 'sans-serif', 'Verdana', '宋体'
	];
	var FONT_WEIGHT = ['normal', 'normal', 'normal', 'bold', 'bolder', 'lighter'];


	var Danmoo = function(config) {
		if (!(this instanceof Danmoo)) {
			return new Danmoo(msg, config);
		}
		this.config = _extend({
			container: doc.body,
			lh: 40,
			gap: 80,
			colors: COLORS,
			showColors: SHADOW_COLORS,
			fontFamily: FONT_FAMILY,
			fontWeight: FONT_WEIGHT
		}, config);

		this.lh = this.config.lh;
		this.gap = this.config.gap;
		this.container = this.config.container;

		var canvas = doc.createElement('canvas');
		canvas.width = this.container.offsetWidth;
		canvas.height = this.container.offsetHeight;
		this.container.appendChild(canvas);
		this.canvas = canvas;
		this.gd = canvas.getContext('2d');
		this.rows = Math.floor(canvas.height / this.lh);

		this.lastBarr = null;
		this.lastGroupFirstBarr = null;
		this.pools = [];

		this.state = 0; //启动状态
		this._rafId = null;

		_optimize(this); //优化动画
	};

	Danmoo.version = '1.0.0';

	Danmoo.prototype.start = function() {
		var _this = this;
		_CAF(this._rafId);
		for (var i = 0, len = this.pools.length; i < len; i++) {
			this.pools[i].move();
		}
		this.state = 1;
		(function anim() {
			if (_this.state !== 0) {
				_this._rafId = _RAF(anim);
				_this.clear();
				//画弹幕
				var i;
				for (i = 0; i < _this.pools.length; i++) {
					_this.pools[i].draw(_this.gd);
				}
				//清除出局的弹幕
				for (i = 0; i < _this.pools.length; i++) {
					if (_this.pools[i].isOut) {
						_this.pools.splice(i, 1);
					}
				}
			}
		})();
		return this;
	};

	Danmoo.prototype.stop = function() {
		this.state = 0;
		this.clear();
		this.pools = [];
		return this;
	};

	Danmoo.prototype.suspend = function() {
		this.state = 0;
		for (var i = 0, len = this.pools.length; i < len; i++) {
			this.pools[i].suspend();
		}
		return this;
	};

	Danmoo.prototype.clear = function() {
		this.gd.clearRect(0, 0, this.canvas.width, this.canvas.height);
	};

	Danmoo.prototype.runScreensaver = function(msg) {
		if (this.state === 2) return;
		this.pools = [];
		this.state = 2;
		var _this = this;
		if (this.state === 2) {
			(function run() {
				_this.emit(msg);
				setTimeout(function() {
					run();
				}, 180);
			})();
		}
		return this;
	};


	Danmoo.prototype.emit = function(msg) {
		if (this.state === 0) return;
		var barr = new Barrage(msg, this.config);
		this.lastBarr = this.pools[this.pools.length - 1];
		if (!this.lastBarr) {
			barr.row = 1; //第一行
			barr.x = this.canvas.width;
			barr.y += this.lh * (barr.row - 1);
			this.lastGroupFirstBarr = barr;
		} else {
			if (this.lastGroupFirstBarr.x + this.lastGroupFirstBarr.w + this.gap > this.canvas.width) { //如果当前列第一行超画布范围
				barr.row = this.lastBarr.row + 1;
				if (barr.row > this.rows) { //如果大于最大行数
					//另起一列
					barr.row = 1;
					barr.x = this.canvas.width;
					barr.y += this.lh * (barr.row - 1);
					this.lastGroupFirstBarr = barr;
				} else {
					//将新生成的放在前一个的下一行
					barr.x = this.canvas.width;
					barr.y += this.lh * (barr.row - 1);
				}

			} else {
				//另起一列
				barr.row = 1;
				barr.x = this.canvas.width;
				barr.y += this.lh * (barr.row - 1);
				this.lastGroupFirstBarr = barr;
			}
		}
		this.pools.push(barr);
	};



	function Barrage(msg, config) {
		if (!(this instanceof Barrage)) {
			return new Barrage(msg);
		}
		var colors = config.colors;
		var showColors = config.showColors;
		var fontFamilys = config.fontFamily;
		var fontWeights = config.fontWeight;


		var fontWeight = fontWeights.sort(_shuffleFn)[_rnd(0, fontWeights.length)];
		var fontSize = _rnd(16, 30);
		if (msg.length < 3 && Math.random() < 0.1) {
			fontSize = 100;
		}
		var fontFamily = fontFamilys.sort(_shuffleFn)[_rnd(0, fontFamilys.length)];

		this.font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;

		this.color = colors.sort(_shuffleFn)[_rnd(0, colors.length)];
		this.shadowColor = showColors.sort(_shuffleFn)[_rnd(0, showColors.length)];
		this.speed = msg.length * (fontSize / 12); //默认速度
		this.msg = msg;
		//初始值，具体需要根据情况计算
		this.x = 0;
		this.y = _rnd(0, 20);
		this.w = 0;

		this._timer = this._rafId = null;

		this.move();
	}

	Barrage.prototype.move = function() {
		var _this = this;
		this.suspend();
		//文字走动
		this.timer = setTimeout(function moveText() {
			_this.x -= _this.speed;
			//判断是否走出画布左边
			if (_this.x + _this.w < -10) {
				_this.isOut = true; //打上出局标记
			}
			if (!_this.isOut) {
				_this._rafId = _RAF(moveText);
			}
		}, 30);
	};

	Barrage.prototype.suspend = function() {
		clearTimeout(this._timer);
		_CAF(this._rafId);
	};

	Barrage.prototype.draw = function(gd) {
		gd.save();

		gd.font = this.font;
		gd.fillStyle = this.color;
		gd.shadowOffsetX = 1;
		gd.shadowOffsetY = 1;
		gd.shadowColor = this.shadowColor;
		gd.textBaseline = 'top';
		gd.fillText(this.msg, this.x, this.y);

		if (this.w <= 0) { //只有在画布环境下才能确定文字尺寸
			this.w = gd.measureText(this.msg).width;
			this.speed = Math.pow(this.w, 1 / 3) * 0.6;
		}

		gd.restore();
	};


	exports.Danmoo = Danmoo;

})(window);