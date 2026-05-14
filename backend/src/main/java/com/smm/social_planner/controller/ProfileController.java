package com.smm.social_planner.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smm.social_planner.dto.ProfileDTO;
import com.smm.social_planner.service.ProfileService;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    // Chiamato dal frontend dopo signup/login per creare o aggiornare il profilo
    @PostMapping
    public ProfileDTO upsertProfile(
            @RequestBody ProfileDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        return profileService.upsertProfile(userId, dto.getFullName(), email, dto.getRole());
    }

    // Restituisce il profilo dell'utente corrente
    @GetMapping("/me")
    public ProfileDTO getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        return profileService.getProfile(jwt.getSubject());
    }
}
