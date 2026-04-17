package com.smm.social_planner.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.smm.social_planner.model.Brand;
import com.smm.social_planner.repository.BrandRepository;

@Service
public class BrandService {
    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    public Brand createBrand(Brand brand) {
        return brandRepository.save(brand);
    }

    public List<Brand> getAllBrandsBySmm(UUID smmId) {
        return brandRepository.findBySmmId(smmId);
    }

    public Brand updateBrand(UUID id, Brand brandDetails) {
        return brandRepository.findById(id).map(brand -> {
            brand.setName(brandDetails.getName());
            brand.setOwnerName(brandDetails.getOwnerName());
            brand.setEmail(brandDetails.getEmail());
            brand.setPhone(brandDetails.getPhone());
            brand.setTiktokUrl(brandDetails.getTiktokUrl());
            brand.setInstagramUrl(brandDetails.getInstagramUrl());
            brand.setFacebookUrl(brandDetails.getFacebookUrl());
            return brandRepository.save(brand);
        }).orElseThrow(() -> new RuntimeException("Brand non trovato"));
    }

    public void deleteBrand(UUID id) {
        brandRepository.deleteById(id);
    }
}