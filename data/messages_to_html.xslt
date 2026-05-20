<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <div class="chat-history-container">
      <ul class="space-y-4">
        <xsl:for-each select="messages/message">
          <li class="p-3 rounded-lg flex flex-col">
            <xsl:attribute name="class">
              <xsl:choose>
                <xsl:when test="senderRole='mechanic'">p-3 rounded-lg flex flex-col bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 self-start text-left max-w-[80%]</xsl:when>
                <xsl:otherwise>p-3 rounded-lg flex flex-col bg-gray-100 dark:bg-gray-800 border-r-4 border-gray-400 dark:border-gray-600 self-end text-right ml-auto max-w-[80%]</xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
            <span class="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1">
              <xsl:value-of select="senderName"/> • <xsl:value-of select="timestamp"/>
            </span>
            <p class="text-sm text-gray-800 dark:text-gray-200">
              <xsl:value-of select="text"/>
            </p>
          </li>
        </xsl:for-each>
      </ul>
    </div>
  </xsl:template>
</xsl:stylesheet>
