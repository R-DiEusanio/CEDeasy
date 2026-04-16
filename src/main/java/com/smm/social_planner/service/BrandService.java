package com.smm.social_planner.service;

import com.smm.social_planner.model.Brand;
import com.smm.social_planner.repository.BrandRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class BrandService {

    private final BrandRepository brandRepository;

    public BrandService(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    public Brand createBrand(String name, UUID smmId) {
        Brand brand = new Brand();
        brand.setName(name);
        brand.setSmmId(smmId);
        return brandRepository.save(brand);
    }

    public List<Brand> getAllBrandsBySmm(UUID smmId) {
        return brandRepository.findBySmmId(smmId);
    }
}