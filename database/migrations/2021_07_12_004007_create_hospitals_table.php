<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateHospitalsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('hospitals', function (Blueprint $table): void {
            $table->id();
            $table->integer('regency_id');
            $table->string('name');
            $table->string('hospital_code')->nullable();
            $table->text('address');
            $table->double('latitude');
            $table->double('longitude');
            $table->foreign('regency_id')->references('id')->on('regencies');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('hospitals');
    }
}
