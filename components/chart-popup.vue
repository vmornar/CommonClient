<template>
    <q-dialog v-model="$store.popups.chart.show" class="max-width" :persistent="persistent" full-width fullHeight
        @hide="closeDialog" @keyup.esc="closeDialog" :maximized="maximized">
        <q-card flat>
            <q-card-section dense class="row text-bold q-pa-sm">
                <span v-html="title" />
                <q-space />
                <q-btn class="copy" dense flat size="sm" icon="content_copy" @click="copyToClipboard" />
                <q-btn dense flat size="sm" icon="download" @click="download" />
                <help-button v-if="help" :name="$t(help)" :titleToShow="titleToShow ? $t(titleToShow) : $t(help)" />
                <q-btn dense size="sm" flat round icon="close" @click="closeDialog" />
            </q-card-section>
            <q-card-section class="q-pa-none">
                <div id="chart-container">
                    <chart ref="chart" :chartData="chartData" :chartOptions="chartOptions" :type="chartType" />
                </div>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script>

/**
 * Chart component
 * 
 * @component
 * @name Chart
 * @example
 * <Chart />
 */

import { StatisticsMixin } from "../mixins/statistics";

import { loadComponent } from "@/common/component-loader";

export default {
    name: "ChartPopup",
    mixins: [StatisticsMixin],
    components: {
        Chart: loadComponent('chart')
    },
    data: () => ({
        maximized: false,
        help: "",
        titleToShow: "",
        persistent: false,
        title: "",
        chartType: "bar",
        xScale: "linear",
        annotationAxis: "y",
        stat: null,
        chartData: {},
        chartOptions: {},
        chartColors: [
            '#1abc9c', // Turquoise
            '#2ecc71', // Emerald
            '#3498db', // Peter River
            '#9b59b6', // Amethyst
            '#34495e', // Wet Asphalt
            '#16a085', // Green Sea
            '#27ae60', // Nephritis
            '#2980b9', // Belize Hole
            '#8e44ad', // Wisteria
            '#2c3e50', // Midnight Blue
            '#f39c12', // Orange
            '#e74c3c', // Pomegranate
            '#ecf0f1', // Clouds
            '#95a5a6', // Concrete
            '#d35400', // Pumpkin
            '#c0392b', // Alizarin
            '#bdc3c7', // Silver
            '#7f8c8d', // Asbestos
        ]
    }),
    async mounted() {
        this.copyObject(this.$store.popups.chart.props, this, true);
        this.showChart();
    },
    methods: {
        /**
         * Downloads the chart as an image.
         */
        download() {
            this.export(true, "chart-container", "chart.png");
            //this.$refs.chart.download();
        },
        /**
         * Copies the chart as an image to clipboard.
         */
        copyToClipboard() {
            this.export(false, "chart-container");
            //this.$refs.chart.copyToClipboard();
        },

        /**
         * Closes the dialog box.
         */
        closeDialog() {
            this.$store.popups.chart.show = false;
        },

        /**
         * Returns the x-axis label for the chart.
         * If the chart is a time chart, it parses the time value using the parseTime method.
         * Otherwise, it returns the original x value.
         *
         * @param {any} x - The x value for the chart.
         * @returns {string} The x-axis label for the chart.
         */
        xLabel(x) {
            return this.timeChart ? this.parseTime(x, false) : x;
        },

        /**
         * Displays a chart based on the provided parameters (as objects in "this").
         *
         * @param {string} chartType - The type of the chart. Valid values are 'line', 'bar', 'radar', 'doughnut', 'polarArea', 'bubble' and 'scatter'. Default is 'bar'.
         * @param {object} data - The data source for the chart. Can be an array of objects or an object with x and y arrays.
         * @param {object} stat - The statistics for the chart. Includes min, max, avg, median and stdev. If not provided, it will be calculated.
         * @param {string} labelField - The field representing the label in the data source.
         * @param {string} valueField - The field representing the value in the data source. Can be an array of fields, in which case the chart will display multiple series.
         * @param {string} seriesField - The field representing the series in the data source.
         * @param {string} title - The title of the chart.
         * @param {string} unit - The unit of measurement for the chart.
         * @param {string} xScale - The scale type of the x-axis. Valid values are 'linear','time' and 'category'. Default is 'linear'.
         * @param {boolean} xyChart - Whether the chart is an XY chart (expects that data object contains x and y arrays). Default is false.
         * @param {boolean} trendLine - Whether to display a trend line. Default is false.
         * @param {boolean} secondDerivative - Whether to display the second derivative. Default is false.
         * @param {boolean} numerical - Whether the values are numerical. Default is true.
         * @param {boolean} feature - The feature to display on the chart. Default is null.
         * @param {string} annotationAxis - The axis to display annotations on. Default is 'y'.
         * @param {string} help - The help text to display.
         * @param {string} titleToShow - The title to show on the help button.
         * @param {boolean} persistent - Whether the dialog is persistent. 
         */
        async showChart() {
            this.chartData = {};
            this.chartOptions = {};
            let unitSuffix = this.unitText(this.unit);
            this.timeChart = this.xScale == "time";
            if (this.numerical) {
                this.title = this.title + unitSuffix;
            }
            let tl = null;
            let series = {};
            if (this.xyChart) {
                this.chartData.labels = this.data.x;
                if (this.data.y) { // single series
                    series[this.seriesName ?? "none"] = this.data.y;
                } else { // multiple series
                    series = this.data.series;
                };
            } else if (this.stacked) {
                this.chartData.labels = this.data.map(f => f[this.labelField]);
                for (let s of this.valueField) {
                    series[s] = this.data.map(f => f[s]);
                }
            } else if (this.seriesField) {
                for (let item of this.data) {
                    let s = item[this.seriesField];
                    if (!series[s]) series[s] = [];
                    series[s].push({ x: this.xLabel(item[this.labelField]), y: item[this.valueField] });
                }
            } else if (Array.isArray(this.valueField)) {
                for (let s of this.valueField) {
                    series[s] = this.data.map(f => ({ x: this.xLabel(f[this.labelField]), y: f[s] }));
                }
            } else if (this.valueField.startsWith(">")) {
                let start = parseInt(this.valueField.substring(1));
                for (let i = 1; i <= Object.keys(this.data[0]).length; i++) {
                    if (i >= start) {
                        let s = Object.keys(this.data[0])[i - 1];
                        series[s] = this.data.map(f => ({ x: this.xLabel(f[this.labelField]), y: f[s] }));
                    }
                }
            } else {
                series[this.seriesName ?? this.valueField] = this.data.map(f => ({ x: this.xLabel(f[this.labelField], false), y: f[this.valueField] }));
                if (!this.stat) {
                    let v = this.data.map(f => f[this.valueField]).sort();
                    this.stat = this.statistics(v);
                }
                tl = this.trendLine ? this.calcTrendLine(this.data, this.labelField, this.valueField) : null;
            }
            this.chartData.datasets = [];
            let i = 0;
            for (let s of Object.keys(series).sort()) {
                this.chartData.datasets.push({
                    label: this.snakeToSentence(s),
                    data: series[s],
                    pointRadius: series[s].length > 1 ? 1 : 5,
                    backgroundColor: this.chartColors[i % this.chartColors.length],
                    borderColor: this.chartColors[i % this.chartColors.length],
                    lineTension: 0
                });
                if (this.secondDerivative && !this.xyChart) {
                    let d = this.derivative(series[s]);
                    let sd = this.derivative(d);
                    this.chartData.datasets.push({
                        label: this.snakeToSentence(s) + '"',
                        data: sd,
                        pointRadius: series[s].length > 1 ? 1 : 5,
                        backgroundColor: this.chartColors[i % this.chartColors.length],
                        borderColor: this.chartColors[i % this.chartColors.length],
                        lineTension: 0,
                        borderDash: [5, 5],
                        yAxisID: 'y2',
                    });
                }
                i++;
            }

            if (tl != null) {
                this.chartData.datasets.push({
                    label: this.$t('Trendline'),
                    data: tl.trendline,
                    type: 'line',
                    borderColor: 'red',
                    backgroundColor: 'red',
                    pointRadius: 0,
                    borderWidth: 1,
                    pointHitRadius: 5,
                    showLine: true,
                    lineTension: 0,
                    borderDash: [5, 5],
                });
            }

            this.chartOptions = {
                showDataLabels: this.showDataLabels,
                dataLabelsAlign: this.dataLabelsAlign,
                scales: {
                    x: {
                        title : {
                            display: true,
                            text: this.labelField ? this.snakeToSentence(this.labelField) : this.$t('Value')
                        },
                        type: this.xScale,
                        stacked: this.stacked,
                        time: {
                            unit: this.timeUnit ?? 'day',
                            displayFormats: {
                                day: 'YYYY-MM-DD',
                                hour: 'HH:mm'
                            }
                        },
                        ticks: {
                            major: {
                                enabled: true,
                                fontStyle: 'bold'
                            },
                            autoSkip: true, // Ensures that ticks are not skipped
                            maxTicksLimit: 100, // Maximum number of ticks to show
                        },
                    },
                    y: {
                        type: this.yScale,
                        stacked: this.stacked,
                        position: 'left',
                        //     min: stat.min - span, //Math.min(stat.min, stat.min - stat.stdev),
                        //     max: stat.max + span //Math.max(stat.max, stat.max + stat.stdev),
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            filter: item => item.text != "None" && item.text != "null"
                        }
                    }
                }
            };
            if (this.secondDerivative) {
                this.chartOptions.scales.y2 = {
                    position: 'right',
                    title: {
                        display: true,
                        text: '2nd Derivative'
                    },
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                };
            }
            this.chartOptions.annotations = [];
            if (this.stat != null && this.numerical) {
                this.chartOptions.annotations = [
                    {
                        axis: null,
                        n: this.stat.n,
                        sigma: this.stat.stdev,
                        color: 'darkblue'
                    },
                    {
                        axis: this.annotationAxis,
                        label: {
                            text: this.$t('Average') + ': ' + this.stat.avg.toFixed(2) + unitSuffix,
                            color: 'red',
                        },
                        color: 'red',
                        value: this.stat.avg
                    },
                    {
                        axis: this.annotationAxis,
                        label: {
                            text: this.$t('Median') + ': ' + this.stat.median.toFixed(2) + unitSuffix,
                            color: 'green',
                        },
                        value: this.stat.median,
                        color: 'green',
                        offset: this.annotationAxis == 'y' ? 200 : 30,
                    },
                    {
                        axis: this.annotationAxis,
                        label: {
                            text: "-σ" + ': ' + (this.stat.avg - this.stat.stdev).toFixed(2) + unitSuffix,
                            color: 'gray',
                        },
                        value: this.stat.avg - this.stat.stdev,
                        color: 'gray',
                        lineDash: [5, 5],
                        offset: this.annotationAxis == 'y' ? 0 : 50,
                    },
                    {
                        axis: this.annotationAxis,
                        label: {
                            text: "+σ" + ': ' + (this.stat.avg + this.stat.stdev).toFixed(2) + unitSuffix,
                            color: 'gray',
                        },
                        value: this.stat.avg + this.stat.stdev,
                        color: 'gray',
                        lineDash: [5, 5],
                        offset: this.annotationAxis == 'y' ? 0 : 50,
                    }
                ];
            }

            if (this.feature) {
                let value = this.feature.get("value_avg");
                if (!value) value = this.feature.get("value");

                if (value) {
                    let name = this.feature.get("name") ?? this.feature.get("Name");
                    this.chartOptions.annotations.push({
                        axis: this.annotationAxis,
                        label: {
                            text: name + ': ' + value.toFixed(2) + unitSuffix,
                            color: 'blue',
                        },
                        value: value,
                        color: 'blue',
                        offset: 50,
                    });
                }
            };
        },
    },
}
</script>
