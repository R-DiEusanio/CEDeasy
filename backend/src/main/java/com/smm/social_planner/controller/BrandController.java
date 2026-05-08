package com.smm.social_planner.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smm.social_planner.model.Brand;
import com.smm.social_planner.service.BrandService;

@RestController
@RequestMapping("/api/brands")
@CrossOrigin(origins = "*")
public class BrandController {
    private final BrandService brandService;

    public BrandController(BrandService brandService) {
        this.brandService = brandService;
    }

    @GetMapping("/smm/{smmId}")
    public List<Brand> getBrands(@PathVariable UUID smmId) {
        return brandService.getAllBrandsBySmm(smmId);
    }

    @PostMapping
    public Brand createBrand(@RequestBody Brand brand) {
        return brandService.createBrand(brand);
    }

    @PutMapping("/{id}")
    public Brand updateBrand(@PathVariable UUID id, @RequestBody Brand brand) {
        return brandService.updateBrand(id, brand);
    }

    @DeleteMapping("/{id}")
    public void deleteBrand(@PathVariable UUID id) {
        brandService.deleteBrand(id);
    }
}