package com.smm.social_planner.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BrandDTO {
    private String id;
    private String name;
    private String smmId;
    private String ownerName;
    private String email;
    private String phone;
    private String tiktokUrl;
    private String instagramUrl;
    private String facebookUrl;
    private String telegramUrl;
    private String linkedinUrl;
}
