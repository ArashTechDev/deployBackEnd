// backend/src/controllers/reports.controller.js
const volunteerReportService = require('../services/volunteerReportService');

/**
 * Generate volunteer hours report
 */
exports.generateHoursReport = async (req, res) => {
  try {
    const filters = {
      foodbank_id: req.query.foodbank_id,
      volunteer_id: req.query.volunteer_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      status: req.query.status || 'completed',
      group_by: req.query.group_by || 'volunteer'
    };

    const report = await volunteerReportService.generateHoursReport(filters);

    res.json({
      success: true,
      data: report,
      message: 'Hours report generated successfully'
    });
  } catch (error) {
    console.error('Error generating hours report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate hours report',
      error: error.message
    });
  }
};

/**
 * Generate volunteer performance report
 */
exports.generatePerformanceReport = async (req, res) => {
  try {
    const filters = {
      foodbank_id: req.query.foodbank_id,
      volunteer_id: req.query.volunteer_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      min_rating: req.query.min_rating ? parseInt(req.query.min_rating) : 1
    };

    const report = await volunteerReportService.generatePerformanceReport(filters);

    res.json({
      success: true,
      data: report,
      message: 'Performance report generated successfully'
    });
  } catch (error) {
    console.error('Error generating performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate performance report',
      error: error.message
    });
  }
};

/**
 * Generate attendance report
 */
exports.generateAttendanceReport = async (req, res) => {
  try {
    const filters = {
      foodbank_id: req.query.foodbank_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      activity_category: req.query.activity_category
    };

    const report = await volunteerReportService.generateAttendanceReport(filters);

    res.json({
      success: true,
      data: report,
      message: 'Attendance report generated successfully'
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance report',
      error: error.message
    });
  }
};

/**
 * Generate monthly volunteer report
 */
exports.generateMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.params;
    const { foodbank_id } = req.query;

    const report = await volunteerReportService.generateMonthlyReport(
      parseInt(year),
      parseInt(month),
      foodbank_id
    );

    res.json({
      success: true,
      data: report,
      message: 'Monthly report generated successfully'
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly report',
      error: error.message
    });
  }
};

/**
 * Export hours report as CSV
 */
exports.exportHoursReportCSV = async (req, res) => {
  try {
    const filters = {
      foodbank_id: req.query.foodbank_id,
      volunteer_id: req.query.volunteer_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      status: req.query.status || 'completed',
      group_by: req.query.group_by || 'volunteer'
    };

    const report = await volunteerReportService.generateHoursReport(filters);
    const csvData = volunteerReportService.formatForCSV(report, 'hours');

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="volunteer-hours-report-${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvData);
  } catch (error) {
    console.error('Error exporting hours report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export hours report',
      error: error.message
    });
  }
};

/**
 * Export performance report as CSV
 */
exports.exportPerformanceReportCSV = async (req, res) => {
  try {
    const filters = {
      foodbank_id: req.query.foodbank_id,
      volunteer_id: req.query.volunteer_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      min_rating: req.query.min_rating ? parseInt(req.query.min_rating) : 1
    };

    const report = await volunteerReportService.generatePerformanceReport(filters);
    const csvData = volunteerReportService.formatForCSV(report, 'performance');

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="volunteer-performance-report-${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvData);
  } catch (error) {
    console.error('Error exporting performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export performance report',
      error: error.message
    });
  }
};

/**
 * Export attendance report as CSV
 */
exports.exportAttendanceReportCSV = async (req, res) => {
  try {
    const filters = {
      foodbank_id: req.query.foodbank_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      activity_category: req.query.activity_category
    };

    const report = await volunteerReportService.generateAttendanceReport(filters);
    const csvData = volunteerReportService.formatForCSV(report, 'attendance');

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="shift-attendance-report-${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csvData);
  } catch (error) {
    console.error('Error exporting attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance report',
      error: error.message
    });
  }
};

/**
 * Get report dashboard data
 */
exports.getReportDashboard = async (req, res) => {
  try {
    const { foodbank_id } = req.query;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get current month stats
    const currentMonthFilters = {
      foodbank_id,
      start_date: startOfMonth.toISOString(),
      end_date: endOfMonth.toISOString()
    };

    const [hoursReport, performanceReport, attendanceReport] = await Promise.all([
      volunteerReportService.generateHoursReport(currentMonthFilters),
      volunteerReportService.generatePerformanceReport(currentMonthFilters),
      volunteerReportService.generateAttendanceReport(currentMonthFilters)
    ]);

    // Get previous month for comparison
    const prevMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    
    const prevMonthFilters = {
      foodbank_id,
      start_date: prevMonthStart.toISOString(),
      end_date: prevMonthEnd.toISOString()
    };

    const prevMonthHours = await volunteerReportService.generateHoursReport(prevMonthFilters);

    // Calculate trends
    const currentTotalHours = hoursReport.summary.total_hours || 0;
    const prevTotalHours = prevMonthHours.summary.total_hours || 0;
    const hoursTrend = prevTotalHours > 0 ? 
      ((currentTotalHours - prevTotalHours) / prevTotalHours * 100).toFixed(1) : 0;

    const currentVolunteerCount = hoursReport.summary.volunteer_count || 0;
    const prevVolunteerCount = prevMonthHours.summary.volunteer_count || 0;
    const volunteerTrend = prevVolunteerCount > 0 ? 
      ((currentVolunteerCount - prevVolunteerCount) / prevVolunteerCount * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        current_month: {
          hours_summary: hoursReport.summary,
          top_volunteers: hoursReport.data.slice(0, 5),
          performance_summary: {
            total_volunteers: performanceReport.data.length,
            avg_rating: performanceReport.data.reduce((sum, v) => sum + (v.avg_performance_rating || 0), 0) / performanceReport.data.length || 0
          },
          attendance_summary: {
            total_shifts: attendanceReport.data.length,
            avg_attendance_rate: attendanceReport.data.reduce((sum, s) => sum + (s.attendance_rate || 0), 0) / attendanceReport.data.length || 0
          }
        },
        trends: {
          hours_trend: hoursTrend,
          volunteer_trend: volunteerTrend
        },
        generated_at: new Date().toISOString()
      },
      message: 'Report dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting report dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get report dashboard data',
      error: error.message
    });
  }
};
