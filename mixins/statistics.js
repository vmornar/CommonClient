/**
 * A mixin object containing commonly used statistical methods.
 */
export const StatisticsMixin = {
    methods: {
        movingAverage(buffer, value, windowSize) {
            buffer.push(value); // Add the new value to the buffer
            if (buffer.length > windowSize) {
              buffer.shift(); // Remove the oldest value if the buffer exceeds the window size
            }
            return buffer.reduce((sum, val) => sum + val, 0) / buffer.length; // Return the average
        },
        /**
         * Calculates the trendline of an array of data points.
         * 
         * @param {Array} arr - The array of data points.
         * @param {string} timeField - The field representing the time in each data point.
         * @param {string} valueField - The field representing the value in each data point.
         * @returns {Object|null} - The trendline object containing the slope, intercept, and trendline points, or null if the array has less than 2 elements.
         */
        calcTrendLine(arr, timeField, valueField) {
            let n = arr.length;
            if (arr.length < 2) return null;
            let sumX = 0, sumY = 0, sumX2 = 0, sumXY = 0;
            let offset = this.parseTime(arr[0][timeField], true);
            let numericTime, value;
            for (let i = 0; i < n; i++) {
                numericTime = this.parseTime(arr[i][timeField], true) - offset;
                value = arr[i][valueField];
                sumX += numericTime;
                sumY += value;
                sumX2 += numericTime * numericTime;
                sumXY += numericTime * value;
            }
            let slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            let intercept = (sumY - slope * sumX) / n;
            return {
                slope: slope,
                intercept: intercept,
                trendline: [
                    { x: this.parseTime(arr[0][timeField], false), y: intercept },
                    { x: this.parseTime(arr[n-1][timeField], false), y: slope * numericTime + intercept }]
            };
        },
        /**
         * Calculates the standard deviation of an array of numbers.
         * 
         * @param {number[]} arr - The array of numbers.
         * @param {number} mean - The mean value of the array.
         * @returns {number} The standard deviation.
         */
        standardDeviation(arr, mean) {
            let n = arr.length;
            return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
        },
        /**
         * Calculates the median value of an array.
         * @param {Array} arr - The input array.
         * @returns {number} The median value.
         */
        median(arr) {
            const length = arr.length
            const mid = Math.floor(length / 2);
            if (length % 2 === 0) {
                return (arr[mid - 1] + arr[mid]) / 2;
            } else {
                return arr[mid];
            }
        },
        /**
         * Calculates the average value of an array.
         * @param {number[]} arr - The array of numbers.
         * @returns {number} The average value.
         */
        average(arr) {
            return arr.reduce((a, b) => a + b, 0) / arr.length;
        },
        /**
         * Calculates various statistics for an array of numbers.
         * @param {number[]} numbers - The array of numbers.
         * @returns {Object} - An object containing the calculated statistics.
         */
        statistics(numbers) {
            const result = numbers.reduce((acc, current) => {
                acc.min = Math.min(acc.min, current);
                acc.max = Math.max(acc.max, current);
                acc.sum += current;
                return acc;
            }, { min: Number.MAX_VALUE, max: Number.MIN_VALUE, sum: 0 });
            result.avg = result.sum / numbers.length;
            result.stdev = this.standardDeviation(numbers, result.avg);
            result.median = this.median(numbers);
            return result;
        },

        /**
         * Calculates the derivative of a series.
         * @param {array} s - The series to calculate the derivative for. Contains objects with x and y properties.
         */
        derivative(s) {
            let d = [];
            for (let i = 0; i < s.length; i++) {
                if (i == 0 || i == s.length - 1) {
                    d.push({ x: s[i].x, y: 0 });
                } else {
                    let dx = s[i + 1].x - s[i - 1].x;
                    let dy = s[i + 1].y - s[i - 1].y;
                    d.push({ x: s[i].x, y: dy / dx });
                }
            }
            return d;
        }
    }
}