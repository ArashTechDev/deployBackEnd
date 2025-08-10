// backend/src/services/volunteerReportService.js
const VolunteerShift = require('../db/models/VolunteerShift');
const Volunteer = require('../db/models/Volunteer');
const Shift = require('../db/models/Shift');
const mongoose = require('mongoose');

class VolunteerReportService {
  /**
   * Generate volunteer hours report
   */
  async generateHoursReport(filters = {}) {
    try {
      const {
        foodbank_id,
        volunteer_id,
        start_date,
        end_date,
        status = 'completed',
        group_by = 'volunteer' // 'volunteer', 'date', 'activity'
      } = filters;

      const matchStage = { status };
      
      if (foodbank_id) {
        matchStage.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
      }
      
      if (volunteer_id) {
        matchStage.volunteer_id = new mongoose.Types.ObjectId(volunteer_id);
      }
      
      if (start_date && end_date) {
        matchStage.work_date = {
          $gte: new Date(start_date),
          $lte: new Date(end_date)
        };
      }

      let pipeline = [{ $match: matchStage }];

      // Add lookup stages for related data
      pipeline.push(
        {
          $lookup: {
            from: 'volunteers',
            localField: 'volunteer_id',
            foreignField: '_id',
            as: 'volunteer'
          }
        },
        { $unwind: '$volunteer' },
        {
          $lookup: {
            from: 'users',
            localField: 'volunteer.user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'shifts',
            localField: 'shift_id',
            foreignField: '_id',
            as: 'shift'
          }
        },
        { $unwind: '$shift' }
      );

      // Group by specified criteria
      switch (group_by) {
        case 'volunteer':
          pipeline.push({
            $group: {
              _id: '$volunteer_id',
              volunteer_name: { $first: '$user.name' },
              volunteer_email: { $first: '$user.email' },
              volunteer_id_number: { $first: '$volunteer.volunteer_id' },
              total_hours: { $sum: '$hours_worked' },
              shift_count: { $sum: 1 },
              avg_performance_rating: { $avg: '$performance_rating' },
              first_shift: { $min: '$work_date' },
              last_shift: { $max: '$work_date' },
              activities: { $addToSet: '$shift.activity_category' }
            }
          });
          break;
          
        case 'date':
          pipeline.push({
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: '$work_date' } }
              },
              date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$work_date' } } },
              total_hours: { $sum: '$hours_worked' },
              volunteer_count: { $addToSet: '$volunteer_id' },
              shift_count: { $sum: 1 },
              activities: { $addToSet: '$shift.activity_category' }
            }
          });
          pipeline.push({
            $addFields: {
              unique_volunteers: { $size: '$volunteer_count' }
            }
          });
          break;
          
        case 'activity':
          pipeline.push({
            $group: {
              _id: '$shift.activity_category',
              activity_category: { $first: '$shift.activity_category' },
              total_hours: { $sum: '$hours_worked' },
              volunteer_count: { $addToSet: '$volunteer_id' },
              shift_count: { $sum: 1 },
              avg_performance_rating: { $avg: '$performance_rating' }
            }
          });
          pipeline.push({
            $addFields: {
              unique_volunteers: { $size: '$volunteer_count' }
            }
          });
          break;
      }

      pipeline.push({ $sort: { total_hours: -1 } });

      const report = await VolunteerShift.aggregate(pipeline);
      
      // Calculate summary statistics
      const summary = await this.calculateSummaryStats(matchStage);

      return {
        summary,
        data: report,
        filters,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating hours report:', error);
      throw error;
    }
  }

  /**
   * Calculate summary statistics
   */
  async calculateSummaryStats(matchStage) {
    try {
      const stats = await VolunteerShift.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total_hours: { $sum: '$hours_worked' },
            total_shifts: { $sum: 1 },
            unique_volunteers: { $addToSet: '$volunteer_id' },
            avg_hours_per_shift: { $avg: '$hours_worked' },
            avg_performance_rating: { $avg: '$performance_rating' }
          }
        },
        {
          $addFields: {
            volunteer_count: { $size: '$unique_volunteers' }
          }
        }
      ]);

      return stats[0] || {
        total_hours: 0,
        total_shifts: 0,
        volunteer_count: 0,
        avg_hours_per_shift: 0,
        avg_performance_rating: 0
      };
    } catch (error) {
      console.error('Error calculating summary stats:', error);
      throw error;
    }
  }

  /**
   * Generate detailed volunteer performance report
   */
  async generatePerformanceReport(filters = {}) {
    try {
      const {
        foodbank_id,
        volunteer_id,
        start_date,
        end_date,
        min_rating = 1
      } = filters;

      const matchStage = { 
        status: 'completed',
        performance_rating: { $gte: min_rating }
      };
      
      if (foodbank_id) {
        matchStage.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
      }
      
      if (volunteer_id) {
        matchStage.volunteer_id = new mongoose.Types.ObjectId(volunteer_id);
      }
      
      if (start_date && end_date) {
        matchStage.work_date = {
          $gte: new Date(start_date),
          $lte: new Date(end_date)
        };
      }

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'volunteers',
            localField: 'volunteer_id',
            foreignField: '_id',
            as: 'volunteer'
          }
        },
        { $unwind: '$volunteer' },
        {
          $lookup: {
            from: 'users',
            localField: 'volunteer.user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$volunteer_id',
            volunteer_name: { $first: '$user.name' },
            volunteer_email: { $first: '$user.email' },
            volunteer_id_number: { $first: '$volunteer.volunteer_id' },
            total_hours: { $sum: '$hours_worked' },
            shift_count: { $sum: 1 },
            avg_performance_rating: { $avg: '$performance_rating' },
            max_performance_rating: { $max: '$performance_rating' },
            min_performance_rating: { $min: '$performance_rating' },
            no_show_count: {
              $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
            },
            cancelled_count: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            reliability_score: {
              $avg: {
                $cond: [
                  { $in: ['$status', ['completed', 'checked_out']] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { avg_performance_rating: -1, total_hours: -1 } }
      ];

      const report = await VolunteerShift.aggregate(pipeline);
      
      return {
        data: report,
        filters,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  /**
   * Generate shift attendance report
   */
  async generateAttendanceReport(filters = {}) {
    try {
      const {
        foodbank_id,
        start_date,
        end_date,
        activity_category
      } = filters;

      const matchStage = {};
      
      if (foodbank_id) {
        matchStage.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
      }
      
      if (start_date && end_date) {
        matchStage.work_date = {
          $gte: new Date(start_date),
          $lte: new Date(end_date)
        };
      }

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'shifts',
            localField: 'shift_id',
            foreignField: '_id',
            as: 'shift'
          }
        },
        { $unwind: '$shift' }
      ];

      // Filter by activity category if provided
      if (activity_category) {
        pipeline.push({
          $match: { 'shift.activity_category': activity_category }
        });
      }

      pipeline.push(
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$work_date' } },
              shift_id: '$shift_id'
            },
            shift_title: { $first: '$shift.title' },
            shift_date: { $first: '$shift.shift_date' },
            shift_start_time: { $first: '$shift.start_time' },
            shift_end_time: { $first: '$shift.end_time' },
            activity_category: { $first: '$shift.activity_category' },
            capacity: { $first: '$shift.capacity' },
            assigned_volunteers: { $sum: 1 },
            completed_volunteers: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            no_show_volunteers: {
              $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
            },
            cancelled_volunteers: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            total_hours: { $sum: '$hours_worked' }
          }
        },
        {
          $addFields: {
            attendance_rate: {
              $divide: ['$completed_volunteers', '$assigned_volunteers']
            },
            capacity_utilization: {
              $divide: ['$assigned_volunteers', '$capacity']
            }
          }
        },
        { $sort: { shift_date: -1 } }
      );

      const report = await VolunteerShift.aggregate(pipeline);
      
      return {
        data: report,
        filters,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating attendance report:', error);
      throw error;
    }
  }

  /**
   * Generate monthly volunteer hours summary
   */
  async generateMonthlyReport(year, month, foodbank_id) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const matchStage = {
        work_date: { $gte: startDate, $lte: endDate },
        status: 'completed'
      };

      if (foodbank_id) {
        matchStage.foodbank_id = new mongoose.Types.ObjectId(foodbank_id);
      }

      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: 'volunteers',
            localField: 'volunteer_id',
            foreignField: '_id',
            as: 'volunteer'
          }
        },
        { $unwind: '$volunteer' },
        {
          $lookup: {
            from: 'users',
            localField: 'volunteer.user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: {
              volunteer_id: '$volunteer_id',
              week: { $week: '$work_date' }
            },
            volunteer_name: { $first: '$user.name' },
            volunteer_id_number: { $first: '$volunteer.volunteer_id' },
            week_number: { $first: { $week: '$work_date' } },
            weekly_hours: { $sum: '$hours_worked' },
            shift_count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.volunteer_id',
            volunteer_name: { $first: '$volunteer_name' },
            volunteer_id_number: { $first: '$volunteer_id_number' },
            total_monthly_hours: { $sum: '$weekly_hours' },
            total_shifts: { $sum: '$shift_count' },
            weekly_breakdown: {
              $push: {
                week: '$week_number',
                hours: '$weekly_hours',
                shifts: '$shift_count'
              }
            }
          }
        },
        { $sort: { total_monthly_hours: -1 } }
      ];

      const report = await VolunteerShift.aggregate(pipeline);
      
      return {
        month: month,
        year: year,
        data: report,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  /**
   * Export report data to CSV format
   */
  formatForCSV(reportData, reportType) {
    try {
      let csvData = [];
      let headers = [];

      switch (reportType) {
        case 'hours':
          headers = [
            'Volunteer ID',
            'Volunteer Name',
            'Email',
            'Total Hours',
            'Shift Count',
            'Average Rating',
            'First Shift',
            'Last Shift',
            'Activities'
          ];
          
          csvData = reportData.data.map(item => [
            item.volunteer_id_number || '',
            item.volunteer_name || '',
            item.volunteer_email || '',
            item.total_hours || 0,
            item.shift_count || 0,
            item.avg_performance_rating ? item.avg_performance_rating.toFixed(2) : 'N/A',
            item.first_shift ? new Date(item.first_shift).toLocaleDateString() : '',
            item.last_shift ? new Date(item.last_shift).toLocaleDateString() : '',
            item.activities ? item.activities.join(', ') : ''
          ]);
          break;

        case 'performance':
          headers = [
            'Volunteer ID',
            'Volunteer Name',
            'Email',
            'Total Hours',
            'Shift Count',
            'Average Rating',
            'Max Rating',
            'Min Rating',
            'No Shows',
            'Cancellations',
            'Reliability Score'
          ];
          
          csvData = reportData.data.map(item => [
            item.volunteer_id_number || '',
            item.volunteer_name || '',
            item.volunteer_email || '',
            item.total_hours || 0,
            item.shift_count || 0,
            item.avg_performance_rating ? item.avg_performance_rating.toFixed(2) : 'N/A',
            item.max_performance_rating || 'N/A',
            item.min_performance_rating || 'N/A',
            item.no_show_count || 0,
            item.cancelled_count || 0,
            item.reliability_score ? (item.reliability_score * 100).toFixed(1) + '%' : 'N/A'
          ]);
          break;

        case 'attendance':
          headers = [
            'Shift Date',
            'Shift Title',
            'Start Time',
            'End Time',
            'Activity Category',
            'Capacity',
            'Assigned Volunteers',
            'Completed',
            'No Shows',
            'Cancelled',
            'Total Hours',
            'Attendance Rate',
            'Capacity Utilization'
          ];
          
          csvData = reportData.data.map(item => [
            new Date(item.shift_date).toLocaleDateString(),
            item.shift_title || '',
            item.shift_start_time || '',
            item.shift_end_time || '',
            item.activity_category || '',
            item.capacity || 0,
            item.assigned_volunteers || 0,
            item.completed_volunteers || 0,
            item.no_show_volunteers || 0,
            item.cancelled_volunteers || 0,
            item.total_hours || 0,
            item.attendance_rate ? (item.attendance_rate * 100).toFixed(1) + '%' : 'N/A',
            item.capacity_utilization ? (item.capacity_utilization * 100).toFixed(1) + '%' : 'N/A'
          ]);
          break;

        default:
          throw new Error('Unsupported report type for CSV export');
      }

      // Convert to CSV string
      const csvString = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvString;
    } catch (error) {
      console.error('Error formatting CSV:', error);
      throw error;
    }
  }
}

module.exports = new VolunteerReportService();
