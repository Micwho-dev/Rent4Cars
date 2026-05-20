<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <head>
        <style>
          table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; }
          th { background: #f8f9fa; color: #1a1a1a; text-align: left; padding: 12px; border-bottom: 2px solid #dee2e6; }
          td { padding: 12px; border-bottom: 1px solid #dee2e6; color: #4a4a4a; font-size: 0.9rem; }
          .priority-high { color: #dc3545; font-weight: bold; }
          .priority-normal { color: #0d6efd; }
          .type-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; text-transform: uppercase; }
          .type-rental { background: #e7f1ff; color: #004085; }
          .type-maintenance { background: #fff3cd; color: #856404; }
          .type-system { background: #d1ecf1; color: #0c5460; }
          
          .dark th { background: transparent; color: #eee; border-color: #333; }
          .dark td { color: #ccc; border-color: #333; }
          .dark h2 { color: #fff; }
        </style>
      </head>
      <body>
        <h2>Weekly Activity Report</h2>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="notifications_log/notification">
              <xsl:sort select="timestamp" order="descending"/>
              <tr>
                <td><xsl:value-of select="timestamp"/></td>
                <td>
                  <span class="type-badge type-{type}">
                    <xsl:value-of select="type"/>
                  </span>
                </td>
                <td>
                  <span class="priority-{attribute::priority}">
                    <xsl:value-of select="attribute::priority"/>
                  </span>
                </td>
                <td>
                  <strong><xsl:value-of select="title"/></strong><br/>
                  <xsl:value-of select="message_body"/>
                </td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
