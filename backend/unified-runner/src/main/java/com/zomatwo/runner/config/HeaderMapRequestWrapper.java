package com.zomatwo.runner.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.*;

public class HeaderMapRequestWrapper extends HttpServletRequestWrapper {

    private final Map<String, String> customHeaders = new HashMap<>();

    public HeaderMapRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    public void addHeader(String name, String value) {
        customHeaders.put(name.toLowerCase(), value);
    }

    @Override
    public String getHeader(String name) {
        String custom = customHeaders.get(name.toLowerCase());
        if (custom != null) {
            return custom;
        }
        return super.getHeader(name);
    }

    @Override
    public Enumeration<String> getHeaderNames() {
        Set<String> set = new HashSet<>(customHeaders.keySet());
        Enumeration<String> e = super.getHeaderNames();
        while (e.hasMoreElements()) {
            set.add(e.nextElement());
        }
        return Collections.enumeration(set);
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
        String custom = customHeaders.get(name.toLowerCase());
        if (custom != null) {
            return Collections.enumeration(Collections.singletonList(custom));
        }
        return super.getHeaders(name);
    }
}
