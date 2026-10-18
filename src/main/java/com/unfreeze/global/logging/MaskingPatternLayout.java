package com.unfreeze.global.logging;

import ch.qos.logback.classic.PatternLayout;
import ch.qos.logback.classic.spi.ILoggingEvent;
import java.util.regex.Pattern;

public class MaskingPatternLayout extends PatternLayout {

    private static final Pattern PHONE = Pattern.compile("01[0-9]-\\d{3,4}-\\d{4}");
    private static final Pattern ACCOUNT = Pattern.compile("(?<!\\d)\\d{10,16}(?!\\d)");

    @Override
    public String doLayout(ILoggingEvent event) {
        return mask(super.doLayout(event));
    }

    static String mask(String message) {
        String masked = PHONE.matcher(message).replaceAll("****");
        return ACCOUNT.matcher(masked).replaceAll("****");
    }
}
