import clone from './clone.js';
import ctors from './constrators.js';

function create(tagName, Highcharts, Vue) {
  var Ctor = Highcharts[ctors[tagName]];
  if (!Ctor) {
    return null;
  }
  var isRenderer = tagName === 'highcharts-renderer';
  var component = {
    name: tagName,
    props: isRenderer
      ? {
          width: { type: Number, required: true },
          height: { type: Number, required: true }
        }
      : { options: { type: Object, required: true },
          destroyDelay: { type: Number, required: false } },
    methods: {
      _initChart: function() {
        this._renderChart();
        if (isRenderer) {
          this.$watch('width', this._renderChart);
          this.$watch('height', this._renderChart);
        } else {
          this.$watch('options', this._renderChart, { deep: true });
        }
      },
      _renderChart: function() {
        if (isRenderer) {
          this.renderer && this.$el.removeChild(this.renderer.box);
          this.renderer = new Ctor(this.$el, this.width, this.height);
        } else {
          this.chart = new Ctor(this.$el, clone(this.options));
        }
      }
    },
    beforeDestroy: function() {
      if (isRenderer) {
        this.$el.removeChild(this.renderer.box);
        for (var property in this.renderer) {
          delete this.renderer[property];
        }
        this.renderer = null;
      } else if (this.chart) {
        if (!this.destroyDelay) {
          this.chart.destroy();
          return;
        }
        var chartContainerId = this.chart.container.id;
        setTimeout(function() {
          for (var i = Highcharts.charts.length - 1; i >= 0; i--) {
            if (Highcharts.charts[i] && Highcharts.charts[i].container.id === chartContainerId) {
              Highcharts.charts[i].destroy();
            }
          }
        }, this.destroyDelay);
      }
    }
  };
  var isVue1 = /^1\./.test(Vue.version);
  if (isVue1) {
    component.template = '<div></div>';
    component.ready = function() {
      this._initChart();
    };
  } else {
    component.render = function(createElement) {
      return createElement('div');
    };
    component.mounted = function() {
      this._initChart();
    };
  }
  return component;
}

export default create;