<template>
    <div id="chart-container">
        <canvas id="chart" class="chart" ref="chart"></canvas>
    </div>
</template>

<script>
import Chart from 'chart.js/auto';
import 'chartjs-adapter-dayjs-4';
import Zoom from 'chartjs-plugin-zoom';
import Datalabels from 'chartjs-plugin-datalabels';

/**
 * Vue component for rendering a chart using Chart.js library.
 *
 * @component chart
 * @prop {Object} chartData - The data object for the chart.
 * @prop {Object} chartOptions - The options object for the chart.
 * @prop {String} type - The type of chart to render.
 *
 * @emits chartRendered - Event emitted when the chart is rendered.
 * @emits chartDestroyed - Event emitted when the chart is destroyed.
 *
 * @example
<chart :chart-data="data" :chart-options="options" type="line"></chart>
 */
export default {
    name: "Chart",
    props: {
        chartData: Object,
        chartOptions: Object,
        type: String
    },
    data() {
        return {
            chart: null,
            title: "Chart",
            annotationPlugin: {
                id: 'annotation',
                /**
                 * Calculates the index greater than or equal to the given value in the specified array.
                 * 
                 * @param {Array} array - The array to search in.
                 * @param {number} value - The value to compare against.
                 * @returns {number} - The index of the first element in the array that is greater than or equal to the given value.
                 */
                calcIndexGE(array, value) {
                    let left = 0;
                    let right = array.length;
                    while (left < right) {
                        const mid = Math.floor((left + right) / 2);
                        if (array[mid] < value) {
                            left = mid + 1;
                        } else {
                            right = mid;
                        }
                    }
                    return left;
                },
                /**
                 * Hook that is called after the chart is initialized.
                 * @param {Object} chart - The chart object.
                 */
                afterInit(chart) {
                    if (chart.config.options.annotations === undefined) {
                        chart.config.options.annotations = [];
                        return;
                    }
                    for (let a of chart.config.options.annotations) {
                        if (a.axis == 'x') {
                            a.indexGE = this.calcIndexGE(chart.data.labels, a.value);
                            a.indexLE = chart.data.labels[this.indexGE] == a.value ? a.indexGE : a.indexGE - 1;
                        }
                    }
                },
                /**
                * Hook that is called after datasets are drawn. Draws annotations.
                * @param {Object} chart - The chart object.
                */
                afterDatasetsDraw(chart) {
                    const ctx = chart.ctx;
                    const xAxis = chart.scales['x'];
                    const yAxis = chart.scales['y'];
                    for (let a of chart.config.options.annotations) {
                        let xPos, yPos;
                        if (!a.axis) {
                            xPos = xAxis.right - 100;
                            yPos = yAxis.top + 12;
                            ctx.fillStyle = a.color ?? 'black'; 
                            ctx.font = '14px Arial';
                            ctx.fillText("n = " + a.n, xPos, yPos);
                            ctx.fillText("σ = " + a.sigma.toFixed(2), xPos, yPos + 20);
                        } else {
                            ctx.save();
                            if (a.axis == 'x') {
                                yPos = yAxis.top;
                                //xPos =  (xAxis.getPixelForValue(a.indexLE) + xAxis.getPixelForValue(a.indexGE)) / 2;
                                let x1 = xAxis.getPixelForValue(a.indexLE);
                                let x2 = xAxis.getPixelForValue(a.indexGE);
                                let v1 = chart.data.labels[a.indexLE];
                                let v2 = chart.data.labels[a.indexGE];
                                xPos = x1 + (x2 - x1) * (a.value - v1) / (v2 - v1);
                            } else if (a.axis == 'y') {
                                xPos = xAxis.left;
                                yPos = yAxis.getPixelForValue(a.value);
                            }

                            ctx.strokeStyle = a.color ?? 'red'; // Line color
                            ctx.setLineDash(a.lineDash ?? []);
                            ctx.lineWidth = 2; // Line width
                            ctx.beginPath();
                            ctx.moveTo(xPos, yPos);
                            if (a.axis == 'x') {
                                ctx.lineTo(xPos, yPos + yAxis.height);
                            } else {
                                ctx.lineTo(xPos + xAxis.width, yPos);
                            }
                            ctx.stroke();
                            ctx.restore();

                            // Draw the label
                            ctx.fillStyle = a.label.color ?? 'black'; // Label color
                            ctx.font = '14px Arial'; // Label font
                            if (a.axis == 'x') {
                                ctx.fillText(a.label.text, xPos + 3, yPos + (a.offset ?? 10)); // Adjust 
                            } else {
                                ctx.fillText(a.label.text, xPos + (a.offset ?? 10), yPos + 9); // Adjust 
                            }
                        }
                    }
                },
            }
        };
    },
    mounted() {
        this.renderChart();
    },
    unmounted() {
        if (this.chart) {
            this.chart.destroy();
        }
    },
    methods: {
        /**
         * Renders the chart.
         */
        renderChart() {
            const ctx = this.$refs.chart.getContext('2d');
            let options = this.chartOptions;
            options.maintainAspectRatio = false;
            options.scales.x.adapters = {
                date: this.dateAdapter
            };
            // options.plugins.title = {
            //     display: true,
            //     text: this.subSupToUnicode("H<sub>2</sub>O<sup>+</sup> Concentration vs. Time"),
            //     font: {
            //         size: 16
            //     }
            // };
            options.plugins.datalabels = {
                display: options.showDataLabels ?? false,
                formatter: (value, context) => {
                    return value.y;
                },
                color: '#000',
                anchor: function (context) {
                    // Position the label based on the value of the data
                    var value = context.dataset.data[context.dataIndex];
                    return value.y == 0 ? 'start' : 'end';
                },
                align: function (context) {
                    // Align the label based on the value of the data
                    var value = context.dataset.data[context.dataIndex];
                    return value.y == 0 ? 'top' : 'bottom';
                },
                // anchor: 'end',
                // align: options.dataLabelsAlign ?? 'top'
            }
            options.plugins.zoom = {
                pan: {
                    enabled: true,
                    mode: 'x'
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x'
                }
            };
            this.title = options.title;
            this.chart = new Chart(ctx, {
                type: this.type,
                data: this.chartData,
                options: options,
                plugins: [this.annotationPlugin, Zoom, Datalabels]
            });
        }
    },
    beforeDestroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
};
</script>
<style scoped>
#chart-container {
    width: 100%;
    height: calc(100vh - 120px);
}

.center {
    margin-left: auto;
    margin-right: auto;
    display: block;
    text-align: center;
}

.copy {
    position: absolute;
    right: 0px;
    top: 0px;
}
</style>